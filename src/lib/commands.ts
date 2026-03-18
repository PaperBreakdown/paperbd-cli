import { Command } from 'commander';
import pc from 'picocolors';
import { askPaper, getStoredSession, getUsage, listPapers, loginWithBrowser, logout } from './api.js';
import { enforceSupportedCliVersion, getCurrentVersionSync } from './version-check.js';

export type ParsedCliCommand =
  | { kind: 'help' }
  | { kind: 'login' }
  | { kind: 'status' }
  | { kind: 'logout' }
  | { kind: 'usage' }
  | { kind: 'papers' }
  | { kind: 'ask'; arxivId: string; query: string };

export async function parseAndRunCli(argv: string[]): Promise<ParsedCliCommand | null> {
  if (argv.includes('--version') || argv.includes('-V')) {
    console.log(getCurrentVersionSync());
    return null;
  }

  const program = new Command();
  let parsed: ParsedCliCommand | null = null;

  program
    .name('paperbd')
    .description('PaperBD terminal client')
    .version(getCurrentVersionSync());

  program
    .command('login')
    .description('Authenticate in the browser and store a local token')
    .action(async () => {
      await loginWithBrowser();
      console.log(pc.green('Logged in successfully.'));
      parsed = { kind: 'login' };
    });

  program
    .command('status')
    .description('Show the stored authentication status')
    .action(async () => {
      const session = await getStoredSession();
      if (!session) {
        console.log(pc.yellow('Not logged in.'));
      } else {
        console.log(pc.green('Logged in.'));
        if (session.email) {
          console.log(`Email: ${obfuscateEmail(session.email)}`);
        }
        console.log(`Saved at: ${session.savedAt}`);
      }
      parsed = { kind: 'status' };
    });

  program
    .command('logout')
    .description('Remove the local authentication token')
    .action(async () => {
      await logout();
      console.log(pc.green('Logged out.'));
      parsed = { kind: 'logout' };
    });

  program
    .command('usage')
    .description('Show remaining CLI usage for the authenticated user')
    .action(async () => {
      const usage = await getUsage();
      console.log(`Remaining paper analysis: ${usage.remaining_paper_analysis}`);
      console.log(`Remaining CLI requests: ${usage.remaining_cli_requests}`);
      console.log(`Resets at: ${usage.resets_at}`);
      parsed = { kind: 'usage' };
    });

  program
    .command('papers')
    .description('List papers available to the authenticated user')
    .action(async () => {
      const result = await listPapers();
      if (result.papers.length === 0) {
        console.log(pc.yellow('No available papers found.'));
      } else {
        for (const paper of result.papers) {
          console.log(`${paper.arxiv_id}  ${paper.title}`);
        }
      }
      parsed = { kind: 'papers' };
    });

  program
    .command('ask')
    .description('Ask a question about a paper by arXiv ID')
    .requiredOption('--arxiv <id>', 'The arXiv ID')
    .requiredOption('--query <text>', 'The question to ask')
    .action(async (options) => {
      const result = await askPaper({
        arxivId: options.arxiv,
        query: options.query,
      });

      for (const text of result.texts) {
        console.log(text);
        console.log('\n---\n');
      }

      parsed = {
        kind: 'ask',
        arxivId: options.arxiv,
        query: options.query,
      };
    });

  if (argv.length <= 2) {
    program.outputHelp();
    return { kind: 'help' };
  }

  if (!argv.includes('--help') && !argv.includes('-h') && !argv.includes('--version') && !argv.includes('-V')) {
    await enforceSupportedCliVersion();
  }

  await program.parseAsync(argv);
  return parsed;
}

function obfuscateEmail(email: string) {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}*@${domain}`;
  }

  return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
}
