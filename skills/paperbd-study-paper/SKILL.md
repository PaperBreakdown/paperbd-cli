---
name: paperbd-study-paper
description: Help users study research papers with Paper Breakdown. Use when the user wants to study, understand, ask questions about, summarize, or analyze a paper with Paper Breakdown, including requests like "I want to study paper P with Paper Breakdown", "help me read this paper in PaperBD", "use Paper Breakdown for this arXiv paper", or similar requests about looking up a paper, finding its arXiv ID, checking access in the paperbd CLI, and then answering questions about the paper.
---

# PaperBD Study Paper

Guide the user from paper identification to answering questions in Paper Breakdown.

## 1. Identify the paper

First, find the paper's arXiv ID.

- If the user already gave a valid arXiv ID, use it.
- If the user gave only a title, author, or vague description, first do a web search to find the arXiv ID.
- If the web search does not produce a clear arXiv ID, search `export.arxiv.org` second.
- Never guess or infer the arXiv ID from partial information.
- Never spend excessive effort trying to recover the arXiv ID. If the web search and `export.arxiv.org` search both fail, ask the user to provide the arXiv ID directly.
- If multiple papers could match, ask one targeted follow-up question or ask the user to provide the arXiv ID directly.
- Do not proceed to PaperBD commands until you have a specific arXiv ID.

## 2. Verify that `paperbd` is installed

- Ask the user to run `paperbd --help` if needed.
- If `paperbd` is missing, tell them to install it with `npm i -g paperbd`.
- Stop and wait for confirmation before continuing.

## 3. Verify login status

- Prefer `paperbd status`.
- If the CLI indicates the user is not logged in, tell them to run `paperbd login`.
- Explain that login completes in the browser and then returns to the terminal.
- Stop and wait for confirmation before continuing.

## 4. Verify access to the paper

- `paperbd usage` returns:
  - remaining paper analyses
    - Paper analysis means accessing new papers the user has never read with Paper Breakdown.
  - remaining CLI requests
    - CLI requests means every successful CLI query reduces this count.
  - when the current quota resets
- `paperbd papers` returns the list of papers the user currently has access to.
- `paperbd ask --arxiv <arxiv_id> --query "<question>"` automatically tries to add the paper to that list.
- If you have access to the terminal, run these commands yourself. If not, ask the user to run them.
- Even if remaining paper analysis is `0`, still try `paperbd ask`.
- If you want to verify whether the user already has access to a paper, check `paperbd papers | grep <arxiv_id>`.
- If `paperbd ask` succeeds, continue with the answer.
- If `paperbd ask` fails because the paper is not accessible, explain the error and next action.

## 5. Tell the user how to ask questions

Run the following in the terminal:

```bash
paperbd ask --arxiv <arxiv_id> --query "<question>"
```

- `paperbd ask` returns actual PDF passages relevant to the question.
- `paperbd ask` also automatically tries to add the paper to the user's accessible paper list.
- If you have access to the terminal, run this command yourself. If not, ask the user to run it.
- This will print passages directly into the terminal
- Ask simple questions

## 6. Answer the user's question

After the paper is identified and access is confirmed, answer the user's actual question about the paper.

- If the user has not asked a concrete question yet, ask one targeted next question.
- Ask targeted questions one at a time.
- Keep follow-ups specific.

## Retrieval error handling

- `401 Unauthorized`
  - Auth issue. Ask user to paperbd login first
- `400 Bad Request`
  - Missing one `query`, or `arxiv_id`
- `429 Too Many Requests`
  - The user exceeded the CLI rate limit: 5 requests per 60 seconds
  - Tell them to wait and follow `Retry-After` if present
- `403 Forbidden`
  - `FREE` tier cannot use CLI retrieval
  - Or monthly CLI quota was exceeded: `STUDENT` = 100, `RESEARCHER` = 200
- `404 Not Found`
  - The paper is not accessible to that user
  - Tell the user to start the paper analysis from `https://paperbreakdown.com/search?query=<arxiv_id>`
- `500 Internal Server Error`
  - Unexpected server-side failure, such as retrieval pipeline or backend issues

When explaining an error, state the likely cause and the next action. Do not invent CLI capabilities.

## Response style

- Be operational and direct.
- Move the user to the next blocking step quickly.
- When blocked on installation, login, or access, do not continue as if the paper is available.
- Prefer one focused follow-up question over a large questionnaire.
