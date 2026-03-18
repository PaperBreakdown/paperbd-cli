import open from 'open';
import { z } from 'zod';
import { getBaseUrl } from './config.js';
import { clearAuth, loadAuth, saveAuth } from './auth-store.js';
import type {
  AskOptions,
  LoginPollPendingResponse,
  LoginPollSuccessResponse,
  LoginStartResponse,
  PapersResponse,
  RetrievalTextsResponse,
} from './types.js';

class CliApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'CliApiError';
  }
}

const CLI_FEATURE_ACCESS_ERROR =
  "You don't have access to this feature. Currently only STUDENT and RESEARCHER tier can use paper breakdown CLI. See pricing: https://paperbreakdown.com/pricing";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const loginStartSchema = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_url: z.string().url(),
  expires_at: z.string(),
  interval_seconds: z.number().int().positive(),
});

const loginPollPendingSchema = z.object({
  status: z.literal('pending'),
});

const loginPollSuccessSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in_seconds: z.number().int().positive(),
  email: z.string().email().nullable(),
});

const retrievalTextsSchema = z.object({
  texts: z.array(z.string()),
});

const papersSchema = z.object({
  papers: z.array(
    z.object({
      arxiv_id: z.string(),
      title: z.string(),
    })
  ),
});

async function parseJson<T>(response: Response, schema: z.ZodSchema<T>): Promise<T> {
  const json = await response.json();
  return schema.parse(json);
}

async function parseApiError(response: Response) {
  try {
    const json = await response.json();
    if (json && typeof json.error === 'string') {
      return json.error;
    }
  } catch {
    return `Request failed with status ${response.status}`;
  }
  return `Request failed with status ${response.status}`;
}

export async function startLogin(): Promise<LoginStartResponse> {
  const response = await fetch(`${getBaseUrl()}/api/cli/auth/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new CliApiError(await parseApiError(response), response.status);
  }

  return parseJson(response, loginStartSchema);
}

export async function pollLogin(deviceCode: string): Promise<LoginPollPendingResponse | LoginPollSuccessResponse> {
  const response = await fetch(`${getBaseUrl()}/api/cli/auth/poll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_code: deviceCode }),
  });

  if (response.status === 202) {
    return parseJson(response, loginPollPendingSchema);
  }

  if (!response.ok) {
    throw new CliApiError(await parseApiError(response), response.status);
  }

  return parseJson(response, loginPollSuccessSchema);
}

export async function loginWithBrowser() {
  const start = await startLogin();
  await open(start.verification_url);

  const deadline = new Date(start.expires_at).getTime();
  while (Date.now() < deadline) {
    const result = await pollLogin(start.device_code);
    if ('access_token' in result) {
      await saveAuth({
        accessToken: result.access_token,
        email: result.email,
        savedAt: new Date().toISOString(),
      });
      return {
        userCode: start.user_code,
        verificationUrl: start.verification_url,
        email: result.email,
      };
    }
    await sleep(start.interval_seconds * 1000);
  }

  throw new Error('Login timed out before approval.');
}

export async function getStoredSession() {
  return loadAuth();
}

export async function logout() {
  await clearAuth();
}

export async function askPaper(options: AskOptions): Promise<RetrievalTextsResponse> {
  const auth = await loadAuth();
  if (!auth?.accessToken) {
    throw new Error('Not logged in. Run `paperbd login` first.');
  }

  const response = await fetch(`${getBaseUrl()}/api/cli/retrieval/by-arxiv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({
      arxiv_id: options.arxivId,
      query: options.query,
    }),
  });

  if (response.status === 401) {
    await clearAuth();
    throw new Error('Stored session is no longer valid. Run `paperbd login` again.');
  }

  if (!response.ok) {
    const apiError = await parseApiError(response);

    if (response.status === 404) {
      throw new Error(
        `Paper ${options.arxivId} is not available in PaperBD yet. Visit https://paperbreakdown.com/abs/${options.arxivId} to submit it for analysis, then retry.`
      );
    }

    if (response.status === 429) {
      throw new Error('Too many CLI requests. Please wait a bit and try again.');
    }

    if (response.status === 403) {
      throw new Error(CLI_FEATURE_ACCESS_ERROR);
    }

    throw new CliApiError(apiError, response.status);
  }

  return parseJson(response, retrievalTextsSchema);
}

export async function listPapers(): Promise<PapersResponse> {
  const auth = await loadAuth();
  if (!auth?.accessToken) {
    throw new Error('Not logged in. Run `paperbd login` first.');
  }

  const response = await fetch(`${getBaseUrl()}/api/cli/papers`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  if (response.status === 401) {
    await clearAuth();
    throw new Error('Stored session is no longer valid. Run `paperbd login` again.');
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(CLI_FEATURE_ACCESS_ERROR);
    }

    throw new CliApiError(await parseApiError(response), response.status);
  }

  return parseJson(response, papersSchema);
}
