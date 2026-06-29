from django.urls import path
from .views import (
    ShowKnowledgeViewSet, SeasonKnowledgeViewSet,
    ShowQuestionViewSet, SeasonQuestionViewSet,
    KnowledgeFileViewSet, QuestionDestroyView,
)

show_knowledge_list = ShowKnowledgeViewSet.as_view({'get': 'list', 'post': 'create'})
season_knowledge_list = SeasonKnowledgeViewSet.as_view({'get': 'list', 'post': 'create'})
show_questions_list = ShowQuestionViewSet.as_view({'get': 'list', 'post': 'create'})
season_questions_list = SeasonQuestionViewSet.as_view({'get': 'list', 'post': 'create'})
knowledge_delete = KnowledgeFileViewSet.as_view({'delete': 'destroy'})
question_delete = QuestionDestroyView.as_view({'delete': 'destroy'})

urlpatterns = [
    path('shows/<uuid:show_pk>/knowledge/', show_knowledge_list, name='show-knowledge'),
    path('seasons/<uuid:season_pk>/knowledge/', season_knowledge_list, name='season-knowledge'),
    path('shows/<uuid:show_pk>/questions/', show_questions_list, name='show-questions'),
    path('seasons/<uuid:season_pk>/questions/', season_questions_list, name='season-questions'),
    path('knowledge/<uuid:pk>/', knowledge_delete, name='knowledge-delete'),
    path('questions/<uuid:pk>/', question_delete, name='question-delete'),
]
