from apps.episodes.models import Episode
from apps.processing.llm_client import LLMClient
from apps.processing.services import load_prompt, inject_context


def build_transcript_context(episode_ids: list[str]) -> tuple[str, list[dict]]:
    """
    Fetch the best available transcript for each episode and concatenate them
    into a single context block for the LLM.
    Preference order: english → hebrew → origin.
    Returns (context_text, used_episodes) where used_episodes contains only
    episodes that had actual transcript content.
    Each episode header embeds its UUID so the LLM can echo it back in SOURCES.
    """
    episodes = (
        Episode.objects.filter(id__in=episode_ids)
        .prefetch_related('transcripts')
        .order_by('episode_number')
    )

    parts = []
    used_episodes = []
    for episode in episodes:
        transcript = (
            episode.transcripts.filter(language='english').first()
            or episode.transcripts.filter(language='hebrew').first()
            or episode.transcripts.filter(language='origin').first()
        )
        if not transcript or not transcript.rows:
            continue

        lines = '\n'.join(
            f"{row.get('character_name', 'Unknown')}: {row.get('text', '').strip()}"
            for row in transcript.rows
        )
        ep_id = str(episode.id)
        parts.append(
            f"=== EPISODE_ID:{ep_id} | {episode.episode_number}: {episode.title} ===\n{lines}"
        )
        used_episodes.append({
            'id': ep_id,
            'episode_number': episode.episode_number,
            'title': episode.title,
        })

    context = '\n\n'.join(parts) if parts else '[No episodes selected]'
    return context, used_episodes


def _parse_sources(raw_reply: str, available_episodes: list[dict]) -> tuple[str, list[dict]]:
    """
    Extract the SOURCES line appended by the LLM, parse UUIDs, and return
    only the episodes whose IDs the LLM cited. Returns (clean_reply, referenced_episodes).
    """
    lines = raw_reply.rstrip().splitlines()
    for i in range(len(lines) - 1, max(len(lines) - 4, -1), -1):
        if lines[i].strip().upper().startswith('SOURCES:'):
            clean_reply = '\n'.join(lines[:i]).rstrip()
            raw_ids = lines[i].split(':', 1)[1].strip()
            break
    else:
        return raw_reply, []

    if raw_ids.lower() == 'none' or not raw_ids:
        return clean_reply, []

    cited_ids = {part.strip() for part in raw_ids.split(',')}
    id_to_ep = {ep['id']: ep for ep in available_episodes}
    referenced = [id_to_ep[eid] for eid in cited_ids if eid in id_to_ep]
    return clean_reply, referenced


def run_chat(episode_ids: list[str], messages: list[dict]) -> dict:
    """
    Build context from the selected episodes and call the LLM with the full
    conversation history. Returns {'reply': str, 'episodes': list[dict]}.
    Only episodes the LLM explicitly cited in its SOURCES line are returned.
    """
    context, available_episodes = build_transcript_context(episode_ids)
    prompt_template = load_prompt('chat')
    system_prompt = inject_context(prompt_template, CONTEXT=context)
    client = LLMClient()
    raw_reply = client.chat(system_prompt=system_prompt, messages=messages)
    reply, referenced_episodes = _parse_sources(raw_reply, available_episodes)
    return {'reply': reply, 'episodes': referenced_episodes}
