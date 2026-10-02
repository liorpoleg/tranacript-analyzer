from rest_framework import serializers
from .models import Show, ShowMembership


class ShowSerializer(serializers.ModelSerializer):
    direct_episode_count = serializers.SerializerMethodField()
    direct_children_count = serializers.SerializerMethodField()
    episode_count = serializers.SerializerMethodField()
    root_id = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Show
        fields = [
            'id', 'name', 'description', 'organization', 'organization_name', 'parent',
            'root_id', 'is_active', 'direct_episode_count', 'direct_children_count',
            'episode_count', 'my_role', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        from .permissions import get_effective_role
        return get_effective_role(request.user, obj)

    def get_direct_episode_count(self, obj):
        counts = self.context.get('recursive_counts')
        if counts is not None:
            return counts.get(str(obj.id), {}).get('direct_episode_count', 0)
        return obj.direct_episode_count

    def get_direct_children_count(self, obj):
        return obj.direct_children_count

    def get_root_id(self, obj):
        """The top-level ancestor's id — every node (root or nested) reports it, so
        clients can always create episodes/navigate against the true root without a
        separate lookup."""
        return str(obj.get_root().id)

    def get_episode_count(self, obj):
        """Recursive total: this node's own episodes + every descendant's episodes.
        Reads a precomputed dict when the view already batched it (list endpoints);
        falls back to a single-object recursive query otherwise (lone retrieve)."""
        counts = self.context.get('recursive_counts')
        if counts is not None:
            return counts.get(str(obj.id), {}).get('episode_count', 0)
        from .services import get_descendant_ids
        descendant_ids = get_descendant_ids(obj.id)
        from apps.episodes.models import Episode
        return Episode.objects.filter(primary_show_id__in=[obj.id, *descendant_ids]).count()

    def validate(self, data):
        parent = data.get('parent', getattr(self.instance, 'parent', None))
        if parent is None:
            return data
        if self.instance and parent.id == self.instance.id:
            raise serializers.ValidationError('A show cannot be its own parent.')
        node, depth = parent, 1
        while node is not None:
            if self.instance and node.id == self.instance.id:
                raise serializers.ValidationError('A show cannot be its own ancestor.')
            if depth > Show.MAX_DEPTH:
                raise serializers.ValidationError(f'Nesting exceeds max depth of {Show.MAX_DEPTH}.')
            node, depth = node.parent, depth + 1
        return data


class ShowDetailSerializer(ShowSerializer):
    children = ShowSerializer(many=True, read_only=True)

    class Meta(ShowSerializer.Meta):
        fields = ShowSerializer.Meta.fields + ['children']


class ShowMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None
    )

    class Meta:
        model = ShowMembership
        fields = [
            'id', 'show', 'user', 'username', 'email', 'role',
            'created_at', 'created_by', 'created_by_username',
        ]
        read_only_fields = ['id', 'show', 'created_at', 'created_by', 'created_by_username']
