export type SessionRecord = {
  session_id: string;
  title?: string;
  started_at?: string;
  ended_at?: string;
  language?: string;
  mode?: string;
  transcript?: string;
  corrected_transcript?: string;
  filtered_transcript?: string;
  summary?: string;
  notes?: string;
  word_count?: number;
  sentence_count?: number;
  folder_id?: string;
  share_token?: string;
  is_public?: boolean;
  [key: string]: unknown;
};

export type FolderRecord = {
  folder_id: string;
  name: string;
  color?: string;
  created_at?: string;
};

export type SessionsResponse = {
  page: number;
  limit: number;
  total: number;
  sessions: SessionRecord[];
};

export type TranslationResponse = {
  translated: string;
  target_lang: string;
  cached?: boolean;
};

export type AdminStats = {
  total_users: number;
  total_sessions: number;
  total_words: number;
};

export type AdminUserRecord = {
  user_id: string;
  email: string;
  name?: string;
  is_admin?: boolean;
  created_at?: string;
  session_count?: number;
};
