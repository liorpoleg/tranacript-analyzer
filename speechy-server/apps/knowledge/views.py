from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import KnowledgeFile, Question
from .serializers import KnowledgeFileSerializer, QuestionSerializer
from .services import save_knowledge_file
from apps.shows.models import Show


class KnowledgeFileViewSet(viewsets.GenericViewSet):
    serializer_class = KnowledgeFileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return KnowledgeFile.objects.filter(show__organization=self.request.user.organization)

    def destroy(self, request, pk=None):
        kf = self.get_queryset().get(pk=pk)
        kf.delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)


class ShowKnowledgeViewSet(viewsets.GenericViewSet):
    serializer_class = KnowledgeFileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_show(self, show_pk):
        return Show.objects.get(pk=show_pk, organization=self.request.user.organization)

    def list(self, request, show_pk=None):
        show = self._get_show(show_pk)
        qs = KnowledgeFile.objects.filter(show=show)
        return Response({'data': KnowledgeFileSerializer(qs, many=True).data, 'error': None})

    def create(self, request, show_pk=None):
        show = self._get_show(show_pk)
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

    def _get_show(self, show_pk):
        return Show.objects.get(pk=show_pk, organization=self.request.user.organization)

    def list(self, request, show_pk=None):
        show = self._get_show(show_pk)
        qs = Question.objects.filter(show=show)
        return Response({'data': QuestionSerializer(qs, many=True).data, 'error': None})

    def create(self, request, show_pk=None):
        show = self._get_show(show_pk)
        data = {**request.data, 'show': show.id}
        s = QuestionSerializer(data=data)
        s.is_valid(raise_exception=True)
        q = s.save()
        return Response({'data': QuestionSerializer(q).data, 'error': None},
                        status=status.HTTP_201_CREATED)


class QuestionDestroyView(viewsets.GenericViewSet):
    def destroy(self, request, pk=None):
        q = Question.objects.filter(
            pk=pk, show__organization=request.user.organization,
        ).first()
        if not q:
            return Response(
                {'data': None, 'error': {'code': 404, 'message': 'Not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        q.delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)
