#!/usr/bin/env node

import { parseAndRunCli } from './lib/commands.js';

await parseAndRunCli(process.argv);
