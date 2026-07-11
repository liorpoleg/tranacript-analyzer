from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.shows.urls')),
    path('api/', include('apps.episodes.urls')),
    path('api/', include('apps.knowledge.urls')),
    path('api/', include('apps.processing.urls')),
    path('api/', include('apps.chat.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
