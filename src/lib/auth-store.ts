import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { StoredAuth } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.paperbd-cli');
const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json');

export async function loadAuth(): Promise<StoredAuth | null> {
  try {
    const raw = await readFile(AUTH_FILE, 'utf8');
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export async function saveAuth(auth: StoredAuth) {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf8');
}

export async function clearAuth() {
  try {
    await rm(AUTH_FILE);
  } catch {
    return;
  }
}

export function getAuthFilePath() {
  return AUTH_FILE;
}
