from django.db import connection
from .models import Show

SEARCH_RESULT_LIMIT = 50


def get_shows_for_user(user):
    from .permissions import get_visible_show_ids_for_user
    return Show.objects.filter(
        id__in=get_visible_show_ids_for_user(user)
    ).select_related('organization')


def create_show(user, data: dict) -> Show:
    data.setdefault('organization', user.organization)
    return Show.objects.create(**data)


def search_shows_by_name(user, query: str) -> list:
    """Shows anywhere in the user's organization whose name matches the query,
    regardless of depth in the tree — backs the sidebar's backend-driven search
    (kept server-side, rather than filtering an already-fetched tree client-side,
    so it composes with future pagination/infinite-scroll)."""
    from .permissions import get_visible_show_ids_for_user
    query = (query or '').strip()
    if not query:
        return []
    return list(
        Show.objects.filter(id__in=get_visible_show_ids_for_user(user), name__icontains=query)
        .select_related('organization', 'parent')
        .order_by('name')[:SEARCH_RESULT_LIMIT]
    )


def get_descendant_ids(show_id) -> list:
    """All descendant show ids under show_id (excluding show_id itself), any depth."""
    sql = """
        WITH RECURSIVE descendants AS (
            SELECT id FROM shows_show WHERE parent_id = %s
            UNION ALL
            SELECT s.id FROM shows_show s
            INNER JOIN descendants d ON s.parent_id = d.id
        )
        SELECT id FROM descendants
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [show_id])
        return [row[0] for row in cursor.fetchall()]


def get_show_tree_with_counts(root_id):
    """The full subtree rooted at root_id (root included), each node annotated with
    direct_episode_count (its own primary_show episodes) and episode_count (recursive
    total through all descendants) — computed via one query + one in-memory rollup pass,
    no per-node queries regardless of tree size."""
    sql = """
        WITH RECURSIVE tree AS (
            SELECT id, parent_id, name FROM shows_show WHERE id = %s
            UNION ALL
            SELECT s.id, s.parent_id, s.name FROM shows_show s
            INNER JOIN tree t ON s.parent_id = t.id
        )
        SELECT tree.id, tree.parent_id, tree.name, COALESCE(ec.direct_count, 0) AS direct_episode_count
        FROM tree
        LEFT JOIN (
            SELECT primary_show_id, COUNT(*) AS direct_count
            FROM episodes_episode
            GROUP BY primary_show_id
        ) ec ON ec.primary_show_id = tree.id
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [root_id])
        rows = cursor.fetchall()

    nodes = {}
    for row_id, parent_id, name, direct_count in rows:
        nodes[str(row_id)] = {
            'id': str(row_id),
            'parent_id': str(parent_id) if parent_id else None,
            'name': name,
            'direct_episode_count': direct_count,
            'episode_count': direct_count,
            'children': [],
        }

    for node in nodes.values():
        if node['parent_id'] and node['parent_id'] in nodes:
            nodes[node['parent_id']]['children'].append(node)

    # Bottom-up rollup: process deepest nodes first (nodes with no children already final).
    def rollup(node):
        for child in node['children']:
            rollup(child)
            node['episode_count'] += child['episode_count']

    root = nodes.get(str(root_id))
    if root:
        rollup(root)
    return root, nodes


def truncate_tree_depth(node: dict, max_depth: int) -> dict:
    """Return a copy of node with branches beyond max_depth levels removed (root = depth 0)."""
    def walk(n, depth):
        copy = {k: v for k, v in n.items() if k != 'children'}
        copy['children'] = [walk(c, depth + 1) for c in n['children']] if depth < max_depth else []
        return copy
    return walk(node, 0)


def get_recursive_episode_ids(show_id) -> list:
    """A node's own cross-listed episode ids + all descendants' — for an
    'include sub-seasons' toggle when browsing a node's episode list."""
    from apps.episodes.models import EpisodeShow
    ids = [show_id, *get_descendant_ids(show_id)]
    return list(
        EpisodeShow.objects.filter(show_id__in=ids).values_list('episode_id', flat=True).distinct()
    )


def get_recursive_episode_ids_for_user(user, show) -> list:
    """Same as get_recursive_episode_ids, but descendants the user can't see
    (an overriding membership excludes them) are dropped from the expansion."""
    from apps.episodes.models import EpisodeShow
    from .permissions import get_visible_descendant_ids
    ids = [show.id, *get_visible_descendant_ids(user, show)]
    return list(
        EpisodeShow.objects.filter(show_id__in=ids).values_list('episode_id', flat=True).distinct()
    )


def get_root_counts_for_user(user) -> dict:
    """Batched recursive episode_count for every root show a user can see, in one query
    (avoids N+1 across the shows list / dashboard)."""
    sql = """
        WITH RECURSIVE tree AS (
            SELECT id, id AS root_id FROM shows_show
            WHERE organization_id = %s AND parent_id IS NULL
            UNION ALL
            SELECT s.id, t.root_id FROM shows_show s
            INNER JOIN tree t ON s.parent_id = t.id
        )
        SELECT tree.root_id, COALESCE(SUM(ec.direct_count), 0) AS episode_count
        FROM tree
        LEFT JOIN (
            SELECT primary_show_id, COUNT(*) AS direct_count
            FROM episodes_episode
            GROUP BY primary_show_id
        ) ec ON ec.primary_show_id = tree.id
        GROUP BY tree.root_id
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [user.organization_id])
        return {str(root_id): {'episode_count': count} for root_id, count in cursor.fetchall()}


def search_show(user, show: Show, query: str) -> list:
    """Search a show's transcripts (all languages) by phrase, its characters via '@', or episode tags via '#'.
    Recursive — includes episodes of every descendant node the user can see, not just this one."""
    from .permissions import get_visible_descendant_ids
    query = (query or '').strip()
    if not query:
        return []
    show_ids = [show.id, *get_visible_descendant_ids(user, show)]
    if query.startswith('@'):
        return _search_show_characters(show_ids, query[1:].strip())
    if query.startswith('#'):
        return _search_show_tags(show_ids, query[1:].strip())
    return _search_show_transcripts(show_ids, query)


def _search_show_transcripts(show_ids: list, term: str) -> list:
    from apps.episodes.models import Transcript

    if not term:
        return []
    term_lower = term.lower()
    results = []
    transcripts = Transcript.objects.filter(
        episode__primary_show_id__in=show_ids
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


def _search_show_tags(show_ids: list, tag_term: str) -> list:
    from apps.episodes.models import EpisodeSummary

    if not tag_term:
        return []
    tag_term_lower = tag_term.lower()
    results = []
    summaries = EpisodeSummary.objects.filter(
        episode__primary_show_id__in=show_ids
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


def _search_show_characters(show_ids: list, name_term: str) -> list:
    from apps.episodes.models import Character

    if not name_term:
        return []
    characters = Character.objects.filter(
        episodes__primary_show_id__in=show_ids,
        name__icontains=name_term,
    ).distinct()
    results = []
    for character in characters:
        episodes = character.episodes.filter(primary_show_id__in=show_ids).order_by('episode_number')
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
