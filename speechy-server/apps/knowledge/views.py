from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import KnowledgeFile, Question
from .serializers import KnowledgeFileSerializer, QuestionSerializer
from .services import save_knowledge_file
from apps.shows.services import get_shows_for_user
from apps.shows.permissions import IsShowViewerOrAbove, IsShowEditorOrAbove


class KnowledgeFileViewSet(viewsets.GenericViewSet):
    serializer_class = KnowledgeFileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated, IsShowEditorOrAbove]

    def get_queryset(self):
        return KnowledgeFile.objects.filter(show__organization=self.request.user.organization)

    def destroy(self, request, pk=None):
        kf = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, kf)
        kf.delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)


class ShowKnowledgeViewSet(viewsets.GenericViewSet):
    serializer_class = KnowledgeFileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated, IsShowViewerOrAbove]

    def _get_show(self, show_pk):
        return get_object_or_404(get_shows_for_user(self.request.user), pk=show_pk)

    def list(self, request, show_pk=None):
        show = self._get_show(show_pk)
        self.check_object_permissions(request, show)
        qs = KnowledgeFile.objects.filter(show=show)
        return Response({'data': KnowledgeFileSerializer(qs, many=True).data, 'error': None})

    def create(self, request, show_pk=None):
        show = self._get_show(show_pk)
        self.check_object_permissions(request, show)
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'No file provided.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        kf = save_knowledge_file(file, show=show)
        return Response({'data': KnowledgeFileSerializer(kf).data, 'error': None},
                        status=status.HTTP_201_CREATED)


class ShowQuestionViewSet(viewsets.GenericViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, IsShowViewerOrAbove]

    def _get_show(self, show_pk):
        return get_object_or_404(get_shows_for_user(self.request.user), pk=show_pk)

    def list(self, request, show_pk=None):
        show = self._get_show(show_pk)
        self.check_object_permissions(request, show)
        qs = Question.objects.filter(show=show)
        return Response({'data': QuestionSerializer(qs, many=True).data, 'error': None})

    def create(self, request, show_pk=None):
        show = self._get_show(show_pk)
        self.check_object_permissions(request, show)
        # request.data is a QueryDict for multipart/form submissions — a dict subclass whose
        # raw storage is list-valued, so a plain {**request.data} spread silently wraps every
        # value in a single-item list. .dict() flattens it back to last-value-per-key first.
        raw = request.data.dict() if hasattr(request.data, 'dict') else request.data
        data = {**raw, 'show': show.id}
        s = QuestionSerializer(data=data)
        s.is_valid(raise_exception=True)
        q = s.save()
        return Response({'data': QuestionSerializer(q).data, 'error': None},
                        status=status.HTTP_201_CREATED)


class QuestionDestroyView(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsShowEditorOrAbove]

    def destroy(self, request, pk=None):
        q = Question.objects.filter(
            pk=pk, show__organization=request.user.organization,
        ).first()
        if not q:
            return Response(
                {'data': None, 'error': {'code': 404, 'message': 'Not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, q)
        q.delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)
