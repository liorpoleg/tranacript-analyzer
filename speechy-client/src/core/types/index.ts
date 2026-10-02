export type UserRole = 'admin' | 'manager' | 'analyst';
export type ShowRole = 'owner' | 'editor' | 'viewer';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
export type JobType = 'translate' | 'summarize' | 'contextual_summary';
export type Language = 'he' | 'en';
export type TranscriptLanguage = 'origin' | 'hebrew' | 'english';
export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  max_episodes: number;
  max_users: number;
  max_storage_mb: number;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization: string;
  organization_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface Show {
  id: string;
  name: string;
  description: string;
  organization: string;
  organization_name: string;
  parent: string | null;
  root_id: string;
  is_active: boolean;
  direct_episode_count: number;
  direct_children_count: number;
  episode_count: number;
  my_role: ShowRole | null;
  created_at: string;
  updated_at: string;
}

export interface ShowDetail extends Show {
  children: Show[];
}

export interface ShowMember {
  id: string;
  show: string;
  user: string;
  username: string;
  email: string;
  role: ShowRole;
  created_at: string;
  created_by: string | null;
  created_by_username: string | null;
  inherited: boolean;
  inherited_from_show_name: string | null;
}

// A "season" is just a Show whose `parent` is set — there is no separate
// Season model. This alias exists only so season-scoped call sites can keep
// reading like domain code.
export type Season = Show;

export interface Character {
  id: string;
  character_ref: string;
  name: string;
  actor: string;
}

export interface Episode {
  id: string;
  primary_show: string;
  primary_show_name: string;
  episode_number: string;
  title: string;
  air_date: string | null;
  original_language: string;
  characters: Character[];
  has_origin_transcript: boolean;
  has_translation_en: boolean;
  has_translation_he: boolean;
  has_summary?: boolean;
  brief_summary?: string;
  my_role: ShowRole | null;
  show_memberships: Array<{
    show: string;
    name: string;
    parent_name: string | null;
    episode_order: number | null;
  }>;
  created_at: string;
  updated_at: string;
}

export interface TranscriptRow {
  character_ref: string;
  character_name: string;
  text: string;
}

export interface Transcript {
  id: string;
  episode: string;
  language: TranscriptLanguage;
  rows: TranscriptRow[];
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  episode_id: string;
  episode_title: string;
  episode_number: string;
  snippet: string;
  character_name: string;
  language: TranscriptLanguage | null;
}

export interface EpisodeSummary {
  id: string;
  episode: string;
  summary_text: string;
  brief_summary: string;
  key_topics: string[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  show: string;
  text: string;
  order_index: number;
  is_active: boolean;
}

export interface ContextualSummary {
  id: string;
  episode: string;
  user: string;
  summary_text: string;
  questions_snapshot: Question[];
  created_at: string;
}

export interface KnowledgeFile {
  id: string;
  show: string;
  original_filename: string;
  file_path: string;
  content_text: string;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  episode: string;
  episode_title: string;
  job_type: JobType;
  status: JobStatus;
  triggered_by: string;
  triggered_by_username: string;
  log_lines: string[];
  started_at: string | null;
  completed_at: string | null;
  duration_seconds?: number;
  created_at: string;
}

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
  key?: string;
}

export interface UserSession {
  id: string;
  username: string;
  ip_address: string | null;
  user_agent: string;
  login_at: string;
  last_active_at: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  username: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export type ChatRole = 'user' | 'assistant';

export interface EpisodeRef {
  id: string;
  episode_number: string;
  title: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  episodes?: EpisodeRef[];
}

export interface ChatReply {
  reply: string;
  episodes: EpisodeRef[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: { code: number; message: string } | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
