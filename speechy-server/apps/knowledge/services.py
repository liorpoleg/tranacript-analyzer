from pathlib import Path
from django.conf import settings
from .models import KnowledgeFile, Question


ALLOWED_EXTENSIONS = {'.txt', '.md', '.docx', '.csv'}


def extract_text_from_file(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()
    if suffix in {'.txt', '.md', '.csv'}:
        return path.read_text(encoding='utf-8', errors='replace')
    if suffix == '.docx':
        try:
            from docx import Document
            doc = Document(str(path))
            return '\n'.join(p.text for p in doc.paragraphs)
        except Exception:
            return ''
    return ''


def save_knowledge_file(file, show=None, season=None) -> KnowledgeFile:
    media_root = Path(settings.MEDIA_ROOT)
    scope = f'show_{show.id}' if show else f'season_{season.id}'
    dest_dir = media_root / 'knowledge' / scope
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / file.name
    with open(dest_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)
    content = extract_text_from_file(str(dest_path))
    return KnowledgeFile.objects.create(
        show=show,
        season=season,
        original_filename=file.name,
        file_path=str(dest_path.relative_to(media_root)),
        content_text=content,
    )


def get_knowledge_for_episode(episode) -> list[str]:
    show = episode.primary_show
    season_ids = episode.episodeseason_set.values_list('season_id', flat=True)
    texts = []
    for kf in KnowledgeFile.objects.filter(show=show):
        texts.append(f'[Show: {show.name}]\n{kf.content_text}')
    for kf in KnowledgeFile.objects.filter(season_id__in=season_ids):
        texts.append(f'[Season knowledge]\n{kf.content_text}')
    return texts


def get_questions_for_episode(episode) -> list[str]:
    show = episode.primary_show
    season_ids = episode.episodeseason_set.values_list('season_id', flat=True)
    questions = list(
        Question.objects.filter(show=show, is_active=True).values_list('text', flat=True)
    ) + list(
        Question.objects.filter(season_id__in=season_ids, is_active=True).values_list('text', flat=True)
    )
    return questions
