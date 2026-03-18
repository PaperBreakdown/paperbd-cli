import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = 'paperbd';
const REGISTRY_LATEST_URL = 'https://registry.npmjs.org/paperbd/latest';
const UPDATE_COMMAND = 'npx install-paperbd@latest';

type SemverParts = {
  major: number;
  minor: number;
  patch: number;
};

type RegistryLatestResponse = {
  version: string;
};

function parseSemver(version: string): SemverParts | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemver(currentVersion: string, latestVersion: string) {
  const current = parseSemver(currentVersion);
  const latest = parseSemver(latestVersion);

  if (!current || !latest) {
    return null;
  }

  if (latest.major !== current.major) {
    return { kind: 'major' as const, currentVersion, latestVersion };
  }

  if (latest.minor !== current.minor) {
    return { kind: 'minor' as const, currentVersion, latestVersion };
  }

  if (latest.patch !== current.patch) {
    return { kind: 'patch' as const, currentVersion, latestVersion };
  }

  return { kind: 'same' as const, currentVersion, latestVersion };
}

async function getCurrentVersion() {
  const packageJsonPath = getPackageJsonPath();
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { version?: string };

  if (!packageJson.version) {
    throw new Error('Unable to determine the current paperbd version.');
  }

  return packageJson.version;
}

function getPackageJsonPath() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '../../package.json');
}

export function getCurrentVersionSync() {
  const packageJsonPath = getPackageJsonPath();
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string };

  if (!packageJson.version) {
    throw new Error('Unable to determine the current paperbd version.');
  }

  return packageJson.version;
}

async function getLatestVersion() {
  const response = await fetch(REGISTRY_LATEST_URL, {
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(1500),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch latest ${PACKAGE_NAME} version.`);
  }

  const json = (await response.json()) as RegistryLatestResponse;
  if (!json.version) {
    throw new Error(`Latest ${PACKAGE_NAME} version response was missing a version.`);
  }

  return json.version;
}

export async function enforceSupportedCliVersion() {
  try {
    const [currentVersion, latestVersion] = await Promise.all([getCurrentVersion(), getLatestVersion()]);
    const comparison = compareSemver(currentVersion, latestVersion);

    if (!comparison || comparison.kind === 'same') {
      return;
    }

    if (comparison.kind === 'patch') {
      console.warn(
        [
          `A newer version of paperbd is available: ${latestVersion} (current: ${currentVersion})`,
          `Update with: ${UPDATE_COMMAND}`,
        ].join('\n')
      );
      return;
    }

    throw new Error(
      [
        `Your paperbd version is no longer supported: ${currentVersion}`,
        `Latest version: ${latestVersion}`,
        `Update required. Run: ${UPDATE_COMMAND}`,
      ].join('\n')
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Your paperbd version is no longer supported')) {
      throw error;
    }
  }
}
