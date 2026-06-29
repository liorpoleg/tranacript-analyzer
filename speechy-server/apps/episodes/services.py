import os
from pathlib import Path
from django.conf import settings
from .models import Episode, EpisodeSeason


def get_episodes_for_user(user):
    return Episode.objects.filter(
        primary_show__organization=user.organization
    ).select_related('primary_show').prefetch_related('translations', 'episodeseason_set__season')


def save_uploaded_excel(episode: Episode, file) -> str:
    media_root = Path(settings.MEDIA_ROOT)
    dest_dir = media_root / 'episodes' / str(episode.id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f'transcript_{file.name}'
    dest_path = dest_dir / filename
    with open(dest_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)
    relative = str(dest_path.relative_to(media_root))
    episode.raw_excel_path = relative
    episode.save(update_fields=['raw_excel_path'])
    return relative


def add_episode_to_season(episode: Episode, season_id: str, order: int = None):
    EpisodeSeason.objects.get_or_create(
        episode=episode, season_id=season_id,
        defaults={'episode_order': order},
    )


def remove_episode_from_season(episode: Episode, season_id: str):
    EpisodeSeason.objects.filter(episode=episode, season_id=season_id).delete()
