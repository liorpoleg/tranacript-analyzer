from rest_framework.permissions import BasePermission
from apps.users.models import Role as OrgRole
from .models import Show, ShowMembership, ShowRole
from .services import get_descendant_ids

ROLE_RANK = {ShowRole.VIEWER: 1, ShowRole.EDITOR: 2, ShowRole.OWNER: 3}


def get_effective_role(user, show):
    """Walk `show` then up its `parent` chain for the nearest node (inclusive)
    that has ANY ShowMembership rows — that node's rows fully replace any
    ancestor's, never merge. Org ADMINs short-circuit to OWNER on every show
    in their own organization."""
    if user is None or not getattr(user, 'is_authenticated', False):
        return None
    if user.role == OrgRole.ADMIN:
        return ShowRole.OWNER if show.organization_id == user.organization_id else None
    node, depth = show, 0
    while node is not None:
        if depth > Show.MAX_DEPTH:
            return None
        memberships = list(ShowMembership.objects.filter(show=node).only('user_id', 'role'))
        if memberships:
            match = next((m for m in memberships if m.user_id == user.id), None)
            return match.role if match else None
        node, depth = node.parent, depth + 1
    return None


def get_visible_show_ids_for_user(user) -> set:
    """Batched version of get_effective_role for queryset filtering — 2 queries
    total regardless of tree depth/size, then one in-memory memoized walk."""
    if user is None or not getattr(user, 'is_authenticated', False):
        return set()
    shows = list(Show.objects.filter(organization=user.organization).values('id', 'parent_id'))
    if user.role == OrgRole.ADMIN:
        return {s['id'] for s in shows}
    by_id = {s['id']: s for s in shows}
    rows_by_show: dict = {}
    for m in ShowMembership.objects.filter(show__organization=user.organization).values(
        'show_id', 'user_id', 'role'
    ):
        rows_by_show.setdefault(m['show_id'], []).append(m)
    resolved: dict = {}

    def resolve(show_id):
        if show_id in resolved:
            return resolved[show_id]
        resolved[show_id] = None  # guard against any accidental cycle
        rows = rows_by_show.get(show_id)
        if rows:
            match = next((r for r in rows if r['user_id'] == user.id), None)
            result = match['role'] if match else None
        else:
            parent_id = by_id[show_id]['parent_id']
            result = resolve(parent_id) if parent_id is not None else None
        resolved[show_id] = result
        return result

    return {s['id'] for s in shows if resolve(s['id']) is not None}


def get_visible_descendant_ids(user, show) -> list:
    """get_descendant_ids(show), filtered down to ones this user can actually see —
    a descendant with its own excluding membership drops out even though `show` itself
    already passed its own check (override, not merge, applies recursively too)."""
    visible = get_visible_show_ids_for_user(user)
    return [sid for sid in get_descendant_ids(show.id) if sid in visible]


def get_members_with_source(show):
    """The nearest node (show itself, or its nearest ancestor) that has ANY explicit
    ShowMembership rows — same walk-up-and-stop-at-first-match rule as get_effective_role.
    Returns (queryset, source_show, inherited) so callers can display inherited members
    as read-only, attributed to the ancestor they actually come from."""
    node = show
    while node is not None:
        qs = ShowMembership.objects.filter(show=node).select_related('user', 'created_by')
        if qs.exists():
            return qs, node, node.id != show.id
        node = node.parent
    return ShowMembership.objects.none(), None, False


def get_episode_effective_role(user, episode):
    """Highest role across {primary_show} ∪ cross-listed shows — the same show
    set apps/knowledge/services.py uses for get_knowledge_for_episode/get_questions_for_episode."""
    show_ids = {episode.primary_show_id, *episode.shows.values_list('id', flat=True)}
    best = None
    for show in Show.objects.filter(id__in=show_ids):
        role = get_effective_role(user, show)
        if role and (best is None or ROLE_RANK[role] > ROLE_RANK[best]):
            best = role
    return best


class _ShowRolePermission(BasePermission):
    required_rank = ROLE_RANK[ShowRole.VIEWER]

    def has_permission(self, request, view):
        return True  # list/create are queryset-filtered or unrestricted; only object-level matters here

    def has_object_permission(self, request, view, obj):
        show = obj if isinstance(obj, Show) else getattr(obj, 'show', None)
        if show is None:
            return False
        role = get_effective_role(request.user, show)
        return role is not None and ROLE_RANK[role] >= self.required_rank


class IsShowViewerOrAbove(_ShowRolePermission):
    required_rank = ROLE_RANK[ShowRole.VIEWER]


class IsShowEditorOrAbove(_ShowRolePermission):
    required_rank = ROLE_RANK[ShowRole.EDITOR]


class IsShowOwner(_ShowRolePermission):
    required_rank = ROLE_RANK[ShowRole.OWNER]


class _EpisodeRolePermission(BasePermission):
    required_rank = ROLE_RANK[ShowRole.VIEWER]

    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj):
        episode = obj if hasattr(obj, 'primary_show_id') else getattr(obj, 'episode', None)
        if episode is None:
            return False
        role = get_episode_effective_role(request.user, episode)
        return role is not None and ROLE_RANK[role] >= self.required_rank


class IsEpisodeViewerOrAbove(_EpisodeRolePermission):
    required_rank = ROLE_RANK[ShowRole.VIEWER]


class IsEpisodeEditorOrAbove(_EpisodeRolePermission):
    required_rank = ROLE_RANK[ShowRole.EDITOR]
