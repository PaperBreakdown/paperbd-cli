---
name: paperbd-study-paper
description: Help users study research papers with Paper Breakdown. Use when the user wants to study, understand, ask questions about, summarize, or analyze a paper with Paper Breakdown, including requests like "I want to study paper P with Paper Breakdown", "help me read this paper in PaperBD", "use Paper Breakdown for this arXiv paper", or similar requests about looking up a paper, finding its arXiv ID, checking access in the paperbd CLI, and then answering questions about the paper.
---

# PaperBD Study Paper

Guide the user from paper identification to answering questions in Paper Breakdown.

## 1. Identify the paper

First, find the paper's arXiv ID.

- If the user already gave a valid arXiv ID, use it.
- If the user gave only a title, author, or vague description, identify the most likely arXiv paper.
- If multiple papers could match, ask one targeted follow-up question.
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

Once you have an arXiv ID and a working logged-in CLI, tell the user to check access with:

```bash
paperbd papers | grep <arxiv_id>
```

Replace `<arxiv_id>` with the actual arXiv ID.

- If the paper appears, continue.
- If the paper does not appear, explain that they do not currently have access to that paper in Paper Breakdown.
- If the user wants to start a new paper review or add a paper that is not already available, tell them to go to `paperbreakdown.com` to trigger it there first.

## 5. Tell the user how to ask questions

Run the following in the terminal:

```bash
paperbd ask --arxiv <arxiv_id> --query "<question>"
```

- `paperbd ask` returns actual PDF passages relevant to the question.
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
  - New paper reviews must be started on `paperbreakdown.com`
- `500 Internal Server Error`
  - Unexpected server-side failure, such as retrieval pipeline or backend issues

When explaining an error, state the likely cause and the next action. Do not invent CLI capabilities.

## Response style

- Be operational and direct.
- Move the user to the next blocking step quickly.
- When blocked on installation, login, or access, do not continue as if the paper is available.
- Prefer one focused follow-up question over a large questionnaire.
