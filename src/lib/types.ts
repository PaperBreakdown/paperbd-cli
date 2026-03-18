export type StoredAuth = {
  accessToken: string;
  email?: string | null;
  savedAt: string;
};

export type LoginStartResponse = {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_at: string;
  interval_seconds: number;
};

export type LoginPollPendingResponse = {
  status: 'pending';
};

export type LoginPollSuccessResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in_seconds: number;
  email: string | null;
};

export type RetrievalTextsResponse = {
  texts: string[];
};

export type PaperSummary = {
  arxiv_id: string;
  title: string;
};

export type PapersResponse = {
  papers: PaperSummary[];
};

export type UsageResponse = {
  remaining_paper_analysis: number;
  remaining_cli_requests: number;
  resets_at: string;
};

export type AskOptions = {
  arxivId: string;
  query: string;
};
