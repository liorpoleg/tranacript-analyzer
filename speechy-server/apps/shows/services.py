from .models import Show, Season

SEARCH_RESULT_LIMIT = 50


def get_shows_for_user(user):
    return Show.objects.filter(organization=user.organization).select_related('organization')


def create_show(user, data: dict) -> Show:
    data.setdefault('organization', user.organization)
    return Show.objects.create(**data)


def create_season(show: Show, number: int, title: str = '') -> Season:
    return Season.objects.create(show=show, number=number, title=title)


def search_show(show: Show, query: str) -> list:
    """Search a show's transcripts (all languages) by phrase, its characters via '@', or episode tags via '#'."""
    query = (query or '').strip()
    if not query:
        return []
    if query.startswith('@'):
        return _search_show_characters(show, query[1:].strip())
    if query.startswith('#'):
        return _search_show_tags(show, query[1:].strip())
    return _search_show_transcripts(show, query)


def _search_show_transcripts(show: Show, term: str) -> list:
    from apps.episodes.models import Transcript

    if not term:
        return []
    term_lower = term.lower()
    results = []
    transcripts = Transcript.objects.filter(
        episode__primary_show=show
    ).select_related('episode').order_by('episode__episode_number')
    for transcript in transcripts:
        for row in transcript.rows:
            text = row.get('text', '')
            if term_lower in text.lower():
                results.append({
                    'episode_id': str(transcript.episode_id),
                    'episode_title': transcript.episode.title,
                    'episode_number': transcript.episode.episode_number,
                    'snippet': text,
                    'character_name': row.get('character_name', ''),
                    'language': transcript.language,
                })
                if len(results) >= SEARCH_RESULT_LIMIT:
                    return results
    return results


def _search_show_tags(show: Show, tag_term: str) -> list:
    from apps.episodes.models import EpisodeSummary

    if not tag_term:
        return []
    tag_term_lower = tag_term.lower()
    results = []
    summaries = EpisodeSummary.objects.filter(
        episode__primary_show=show
    ).select_related('episode').order_by('episode__episode_number')
    for summary in summaries:
        matched_topics = [t for t in summary.key_topics if tag_term_lower in t.lower()]
        if matched_topics:
            results.append({
                'episode_id': str(summary.episode_id),
                'episode_title': summary.episode.title,
                'episode_number': summary.episode.episode_number,
                'snippet': ', '.join(matched_topics),
                'character_name': '',
                'language': None,
            })
            if len(results) >= SEARCH_RESULT_LIMIT:
                return results
    return results


def _search_show_characters(show: Show, name_term: str) -> list:
    from apps.episodes.models import Character

    if not name_term:
        return []
    characters = Character.objects.filter(
        episodes__primary_show=show,
        name__icontains=name_term,
    ).distinct()
    results = []
    for character in characters:
        episodes = character.episodes.filter(primary_show=show).order_by('episode_number')
        for episode in episodes:
            results.append({
                'episode_id': str(episode.id),
                'episode_title': episode.title,
                'episode_number': episode.episode_number,
                'snippet': character.name,
                'character_name': character.name,
                'language': None,
            })
            if len(results) >= SEARCH_RESULT_LIMIT:
                return results
    return results
