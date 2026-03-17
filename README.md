# paperbd-cli

PaperBD command-line client.

This repo builds the JavaScript distribution used by the public `paperbd` npm package.

Paper Breakdown: `https://paperbreakdown.com`

## Install

Install the CLI:

```bash
npm i -g paperbd
```

Install the PaperBD skill:

```bash
npx skills add PaperBreakdown/paperbd-cli --skill paperbd-study-paper
```

## Login

Authenticate in your browser:

```bash
paperbd login
```

After you complete login, return to the terminal and the CLI will finish automatically.

## Commands

Show help:

```bash
paperbd --help
```

Check login status:

```bash
paperbd status
```

List your available papers:

```bash
paperbd papers
```

Ask about a paper by arXiv ID:

```bash
paperbd ask --arxiv 2401.1234 --query "What training setup did they use?"
```

`paperbd ask` returns relevant PDF passages for the paper and query.

Log out:

```bash
paperbd logout
```

## Notes

- If a paper is not available in your account yet, start the paper review on `https://paperbreakdown.com` first.
- Once the paper is available to you, use `paperbd papers` to confirm access before running `paperbd ask`.
