import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { App } from './App';
import { parseAndRunCli } from './lib/commands';

const parsed = await parseAndRunCli(process.argv);

if (parsed?.kind !== 'interactive') {
  // A non-interactive command already ran.
} else {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  });

  createRoot(renderer).render(<App />);
}
