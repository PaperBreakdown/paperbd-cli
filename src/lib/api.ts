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
    throw new Error(await parseApiError(response));
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
    throw new Error(await parseApiError(response));
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
      max_steps: options.maxSteps,
    }),
  });

  if (response.status === 401) {
    await clearAuth();
    throw new Error('Stored session is no longer valid. Run `paperbd login` again.');
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
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
    throw new Error(await parseApiError(response));
  }

  return parseJson(response, papersSchema);
}
