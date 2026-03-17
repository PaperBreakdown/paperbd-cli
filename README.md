# paperbd-cli

PaperBD in your terminal.

## Install

Download the binary for your platform and place it on your `PATH`.

On macOS or Linux:

```bash
chmod +x paperbd
mv paperbd /usr/local/bin/paperbd
```

Then verify:

```bash
paperbd --help
```

## Login

Authenticate in the browser:

```bash
paperbd login
```

This opens PaperBD in your browser. After you complete login, return to the terminal and the CLI will finish automatically.

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

Open the interactive terminal app:

```bash
paperbd
```

Log out:

```bash
paperbd logout
```
