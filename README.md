# paperbd-cli

PaperBD command-line client.

This repo builds the JavaScript distribution used by the public `paperbd` npm package.

Paper Breakdown: `https://paperbreakdown.com`

## Install

Recommended installer:

```bash
npx install-paperbd@latest
```

Manual CLI install:

```bash
npm i -g paperbd
```

Manual skill install:

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

Check your remaining usage:

```bash
paperbd usage
```

Ask about a paper by arXiv ID:

```bash
paperbd ask --arxiv 2401.1234 --query "What training setup did they use?"
```

`paperbd ask` returns relevant PDF passages for the paper and query.
It also automatically tries to add the paper to your accessible paper list.

Log out:

```bash
paperbd logout
```

## Notes

- `paperbd papers` lists the papers you currently have access to.
- `paperbd usage` shows your remaining paper analyses, remaining CLI requests, and when the quota resets.
- Paper analysis means accessing new papers you have never read with Paper Breakdown.
- CLI requests means every successful CLI query reduces that count.
- If a paper is not already available to your account, `paperbd ask` will try to add it automatically.
