import { Command } from 'commander';
import pc from 'picocolors';
import { askPaper, getStoredSession, listPapers, loginWithBrowser, logout } from './api.js';
import { enforceSupportedCliVersion } from './version-check.js';

export type ParsedCliCommand =
  | { kind: 'help' }
  | { kind: 'login' }
  | { kind: 'status' }
  | { kind: 'logout' }
  | { kind: 'papers' }
  | { kind: 'ask'; arxivId: string; query: string };

export async function parseAndRunCli(argv: string[]): Promise<ParsedCliCommand | null> {
  const program = new Command();
  let parsed: ParsedCliCommand | null = null;

  program
    .name('paperbd')
    .description('PaperBD terminal client');

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
          console.log(`Email: ${session.email}`);
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

  if (!argv.includes('--help') && !argv.includes('-h')) {
    await enforceSupportedCliVersion();
  }

  await program.parseAsync(argv);
  return parsed;
}
