#!/usr/bin/env node

const readline = require('node:readline');
const { spawnSync } = require('node:child_process');

const CLI_PACKAGE = 'paperbd@latest';
const SKILL_REPO = 'PaperBreakdown/paperbd-cli';
const SKILL_NAME = 'paperbd-study-paper';

function commandName(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function print(line = '') {
  process.stdout.write(`${line}\n`);
}

function run(cmd, args) {
  const result = spawnSync(commandName(cmd), args, { stdio: 'inherit' });
  return result.status === 0;
}

function ask(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      resolve('');
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  print();
  print('PaperBD installer');
  print();
  print('This will:');
  print('  1. Install or upgrade the `paperbd` CLI globally');
  print('  2. Install the PaperBD skill');
  print('  3. Show the next commands to run');
  print();

  print('Installing PaperBD CLI...');
  if (!run('npm', ['install', '-g', CLI_PACKAGE])) {
    print();
    print('Failed to install the PaperBD CLI.');
    process.exit(1);
  }

  print();
  print('Installing the PaperBD skill...');
  const skillInstalled = run('npx', ['skills', 'add', SKILL_REPO, '--skill', SKILL_NAME]);

  print();
  print('Next steps:');
  print('  1. Login:   paperbd login');
  print('  2. Status:  paperbd status');
  print('  3. Papers:  paperbd papers');
  print('  4. Ask:     paperbd ask --arxiv <arxiv_id> --query "<question>"');
  print();
  print('If the paper is not available yet, start the paper review first on paperbreakdown.com.');

  if (!skillInstalled) {
    print();
    print('Skill installation did not complete automatically. Run this manually:');
    print(`  npx skills add ${SKILL_REPO} --skill ${SKILL_NAME}`);
  }

  print();
  const answer = (await ask('Run `paperbd login` now? [Y/n] ')).toLowerCase();
  if (answer === 'n' || answer === 'no') {
    return;
  }

  print();
  run('paperbd', ['login']);
}

main().catch((error) => {
  print();
  print(`Install failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
