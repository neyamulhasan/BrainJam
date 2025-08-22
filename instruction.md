# Brain Jam — VS Code AI Agent Instructions (`instruction.md`)

> Frontend: HTML, CSS, JS • Backend: Node.js (Express) • DB: MySQL • Judge: Judge0 • Realtime: Socket.io

## Goal
Build a competitive programming platform with contests, problems, online code editor, Judge0-based judging, ratings, badges, and real‑time leaderboards.

## High-Level Architecture
- **Frontend**: static HTML/CSS/JS, Monaco/Ace editor, Socket.io client.
- **Backend**: node.js, role-based access.
- **DB**: MySQL , schema in `schema.sql`.
- **Judge**: Judge0 API. 
- **Realtime**: Socket.io namespaces/rooms per contest (`/contest/:id`).// skip realtime for now.




## Judge0 Flow
1. Create `submissions` row (status `Pending`).
2. POST to Judge0 with `{ source_code, language_id (Judge0), stdin }`.
3. Save returned `token` to `submissions.judge0_token`.
4. Poll Judge0 **or** receive webhook at `/api/judge0/callback` with the token.
5. Map Judge0 result to our statuses; update `submissions` + per-testcase results.
6. Emit Socket.io events:
   - `submission:status` → user room `user:{id}`
   - `leaderboard:update` → room `contest:{id}`


## Implementation Notes
- Use DB transactions when updating scores/ratings.
- Keep **contest_scores** as materialized table; recompute on submission updates.
- Enforce `(submission_id_a < submission_id_b)` when inserting plagiarism pairs.
- Use **indexes** on `submissions(status, problem_id, user_id, contest_id)`.

## Rating Bands (display-only)
- Private Recruit (800–999)
- Cadet Coder (1000–1199)
- Code Corporal (1200–1399)
- Tech Lieutenant (1400–1599)
- Algorithm Captain (1600–1899)
- Legendary General (1900+)

## Tasks for AI Agent
- Create MySQL connection pool; run `schema.sql` on init (dev).
- Implement REST endpoints above with controllers/services.
- Add Socket.io server; broadcast leaderboard updates.
- Implement Judge0 service (submit, poll/callback, map verdicts).
- Create minimal frontend: login, contest list/detail, problem page, editor, submissions list, leaderboard.
- Add unit tests for auth, submissions, scoring.