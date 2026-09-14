from django.urls import path
from .views import (
    ShowKnowledgeViewSet,
    ShowQuestionViewSet,
    KnowledgeFileViewSet, QuestionDestroyView,
)

show_knowledge_list = ShowKnowledgeViewSet.as_view({'get': 'list', 'post': 'create'})
show_questions_list = ShowQuestionViewSet.as_view({'get': 'list', 'post': 'create'})
knowledge_delete = KnowledgeFileViewSet.as_view({'delete': 'destroy'})
question_delete = QuestionDestroyView.as_view({'delete': 'destroy'})

urlpatterns = [
    path('shows/<uuid:show_pk>/knowledge/', show_knowledge_list, name='show-knowledge'),
    path('shows/<uuid:show_pk>/questions/', show_questions_list, name='show-questions'),
    path('knowledge/<uuid:pk>/', knowledge_delete, name='knowledge-delete'),
    path('questions/<uuid:pk>/', question_delete, name='question-delete'),
]
