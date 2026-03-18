#!/usr/bin/env node

import pc from 'picocolors';
import { parseAndRunCli } from './lib/commands.js';

try {
  await parseAndRunCli(process.argv);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unexpected CLI error.';
  console.error(pc.red(`Error: ${message}`));
  process.exit(1);
}
