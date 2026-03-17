import { useEffect, useState } from 'react';
import { useKeyboard, useRenderer } from '@opentui/react';
import { askPaper, getStoredSession, listPapers, loginWithBrowser, logout } from './lib/api';
import type { PaperSummary, StoredAuth } from './lib/types';

type FocusField = 'arxiv' | 'query';

export function App() {
  const renderer = useRenderer();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [arxivId, setArxivId] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Ready');
  const [texts, setTexts] = useState<string[]>([]);
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [focus, setFocus] = useState<FocusField>('arxiv');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStoredSession().then(setAuth).catch((error) => {
      setStatus(error instanceof Error ? error.message : 'Failed to load auth');
    });
  }, []);

  useKeyboard(async (key) => {
    if (busy) return;

    if (key.name === 'tab') {
      setFocus((current) => (current === 'arxiv' ? 'query' : 'arxiv'));
      return;
    }

    if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      renderer.destroy();
      return;
    }

    if (key.ctrl && key.name === 'l') {
      setBusy(true);
      setStatus('Opening browser for login...');
      try {
        await loginWithBrowser();
        const session = await getStoredSession();
        setAuth(session);
        setStatus('Login complete.');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Login failed');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (key.ctrl && key.name === 'p') {
      setBusy(true);
      setStatus('Loading papers...');
      try {
        const result = await listPapers();
        setPapers(result.papers);
        setStatus(`Loaded ${result.papers.length} paper${result.papers.length === 1 ? '' : 's'}.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Failed to load papers');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (key.ctrl && key.name === 'x') {
      setBusy(true);
      try {
        await logout();
        setAuth(null);
        setStatus('Logged out.');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Logout failed');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (key.ctrl && key.name === 'r') {
      if (!arxivId.trim() || !query.trim()) {
        setStatus('Both arXiv ID and query are required.');
        return;
      }

      setBusy(true);
      setStatus(`Researching ${arxivId.trim()}...`);
      try {
        const result = await askPaper({
          arxivId: arxivId.trim(),
          query: query.trim(),
          modelName: 'google/gemini-3.1-flash-lite',
        });
        setTexts(result.texts);
        setStatus(`Received ${result.texts.length} text chunk${result.texts.length === 1 ? '' : 's'}.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Ask failed');
      } finally {
        setBusy(false);
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" height="100%" padding={1} backgroundColor="#111111">
      <box border padding={1} marginBottom={1} flexDirection="column">
        <text>
          <strong>PaperBD CLI</strong>
        </text>
        <text>Ctrl+L login, Ctrl+P papers, Ctrl+R ask, Ctrl+X logout, Tab switch field, Esc quit</text>
        <text>
          Auth: <span fg={auth ? '#4ade80' : '#f59e0b'}>{auth ? 'Logged in' : 'Not logged in'}</span>
        </text>
        {auth?.email ? <text>Email: {auth.email}</text> : null}
        <text>Status: {status}</text>
      </box>

      <box flexDirection="column" border padding={1} marginBottom={1}>
        <text>
          <strong>Paper Query</strong>
        </text>
        <text>arXiv ID</text>
        <input
          value={arxivId}
          onChange={setArxivId}
          placeholder="e.g. 2401.1234"
          focused={focus === 'arxiv'}
          width="100%"
        />
        <text>Question</text>
        <input
          value={query}
          onChange={setQuery}
          placeholder="What training setup did they use?"
          focused={focus === 'query'}
          width="100%"
        />
      </box>

      <box flexGrow={1} flexDirection="row" gap={1}>
        <box width="38%" border padding={1} flexDirection="column">
          <text>
            <strong>Available Papers</strong>
          </text>
          <scrollbox flexGrow={1}>
            {papers.length === 0 ? (
              <text fg="#888888">No paper list loaded yet. Press Ctrl+P.</text>
            ) : (
              <box flexDirection="column">
                {papers.map((paper) => (
                  <box key={paper.arxiv_id} marginBottom={1} border padding={1}>
                    <text>
                      <strong>{paper.arxiv_id}</strong>
                      <br />
                      {paper.title}
                    </text>
                  </box>
                ))}
              </box>
            )}
          </scrollbox>
        </box>

        <box flexGrow={1} border padding={1} flexDirection="column">
          <text>
            <strong>Texts</strong>
          </text>
          <scrollbox flexGrow={1}>
            {texts.length === 0 ? (
              <text fg="#888888">No response yet.</text>
            ) : (
              <box flexDirection="column">
                {texts.map((text, index) => (
                  <box key={`${index}-${text.slice(0, 12)}`} marginBottom={1} border padding={1}>
                    <text>{text}</text>
                  </box>
                ))}
              </box>
            )}
          </scrollbox>
        </box>
      </box>
    </box>
  );
}
