const fs = require('node:fs');
const path = require('node:path');

function readPackageJson() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function resolveRepository(packageJson) {
  const repo = packageJson.repository;
  if (!repo) return null;
  if (typeof repo === 'string') return repo;
  if (typeof repo.url === 'string') return repo.url;
  return null;
}

function extractRepoSlug(repoValue) {
  if (!repoValue) return null;

  const trimmed = repoValue
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .trim();

  const githubHttp = trimmed.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)$/);
  if (githubHttp) return githubHttp[1];

  const githubSsh = trimmed.match(/^git@github\.com:([^/]+\/[^/]+)$/);
  if (githubSsh) return githubSsh[1];

  return null;
}

function printLine(line = '') {
  process.stdout.write(`${line}\n`);
}

function main() {
  const packageJson = readPackageJson();
  const repoSlug = extractRepoSlug(resolveRepository(packageJson));
  const skillInstallCommand = repoSlug
    ? `npx skills add ${repoSlug} --skill paperbd-study-paper`
    : 'npx skills add <owner>/<repo> --skill paperbd-study-paper';

  printLine();
  printLine('PaperBD installed.');
  printLine();
  printLine('Next steps:');
  printLine('  1. Login:   paperbd login');
  printLine('  2. Status:  paperbd status');
  printLine('  3. Papers:  paperbd papers');
  printLine('  4. Ask:     paperbd ask --arxiv <arxiv_id> --query "<question>"');
  printLine();
  printLine('Install the PaperBD skill:');
  printLine(`  ${skillInstallCommand}`);
  if (!repoSlug) {
    printLine('  Replace <owner>/<repo> with the public GitHub repo that contains skills/paperbd-study-paper.');
  }
  printLine();
  printLine('If the paper is not available yet, start the paper review first on paperbreakdown.com.');
  printLine();
}

main();
