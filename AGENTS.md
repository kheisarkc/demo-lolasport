# Lola Sport: project instructions

## Communication and authority
- Balas dalam bahasa Indonesia kasual-profesional dengan gua/lu; hasil akademik memakai bahasa formal.
- User instructions outrank this file and installed third-party skills.
- This repository is a local development scaffold, not an approved production system.
- A request to execute a task authorizes its necessary reversible local edits and checks. Continue through planning, implementation, repair, and verification without asking approval at each internal step.
- Ask only for missing decisions that materially change the requested result. Keep unaffected work moving and persist the blocker.
- Deployment, production access, destructive data operations, force push, payments, and customer-data changes require explicit permission.

## Start every task
1. Read `docs/START-HERE.md`, `docs/PROJECT.md`, `docs/DECISIONS.md`, and `docs/STATE.md`.
2. Inspect relevant code and the current Git diff. Preserve unrelated changes.
3. Follow `docs/WORKFLOW.md`; read only relevant specs and skills.
4. For Laravel work, consult Boost documentation matched to installed packages before relying on memory.
5. Before backend edits, read `apps/api/AGENTS.md` and the relevant Boost skills under `apps/api/.agents/skills`.

## Locked architecture
- Laravel owns business rules, authorization, transactions, and persistence in `apps/api`.
- Next.js App Router with TypeScript owns the web interface in `apps/web`.
- PostgreSQL is the selected database. Test behavior on PostgreSQL, including migrations and concurrency-sensitive behavior.
- Do not replace Laravel/Next.js with Livewire, Inertia, a Node backend, or another framework.
- Next.js proxies `/api/v1/*` to Laravel; do not reimplement reservation/payment logic in route handlers.
- Use Laravel Sanctum cookie/session authentication for the future first-party app; do not introduce browser localStorage bearer tokens by default.
- Keep dependencies pinned in lockfiles; introduce packages only when the task justifies them.

## Delivery and verification
- Spec Kit is the primary feature workflow. The authorized task may traverse its stages in one session; do not treat generated stage prompts as a new human-approval requirement when authorization already covers the work.
- Keep feature requirements, implementation plans, acceptance criteria, and checked tasks in `specs/`.
- For bugs, use systematic debugging; for completion, require fresh verification evidence.
- Never claim a check passed if it was not run. Record commands, results, and limitations in `docs/STATE.md` or a task report.
- Run `npm run check` for a full foundation check; run `npm run test:e2e` for browser-flow changes.
- Use `npm run api -- <artisan arguments>` or `scripts/php.ps1` so this Windows project uses PHP 8.4 and its project-local PostgreSQL extensions.
- Treat booking overlap, simultaneous requests, payment totals, report reconciliation, and role boundaries as high-value test cases.
- Money uses integer rupiah or an explicitly justified exact decimal representation, never floating-point arithmetic.
- Booking status and payment status are separate concepts. Unknown commercial rules remain open decisions.
- Keep credentials, `.env` files, generated reports with secrets, and customer information out of Git and logs.
- Do not use fake claims of completed owner validation, interviews, black-box testing, or UAT.

## Scope and session handoff
- Current authorized scope is the complete isolated local demo: accounts, courts, schedules, reservations, manual payments and receipts reporting. Follow specs/001-demo and docs/DEMO-ASSUMPTIONS.md. Never treat this as production or owner UAT.
- After each meaningful task, update `docs/STATE.md`: outcome, evidence, open issues, and the next safe action.
- Use subagents only when the user or an applicable skill explicitly calls for them; isolate file ownership.
- Avoid multiple orchestration frameworks. OpenSpec, BMad, and GSD are not installed alongside Spec Kit.
- Do not alter global Codex permissions, disable sandboxing, or create recurring automations unless separately requested.
- Local continuous execution still depends on a running host, valid sign-in, available usage, and tool approval decisions.

## Active UI redesign
- Redesign mobile seluruh peran mengikuti specs/002-mobile-redesign; aturan domain tetap specs/001-demo dan docs/DEMO-ASSUMPTIONS.md.
- Browser tests memakai layanan test terpisah3002/8002 dan lola_demo_test, dengan guard sebelum cleanup. Jangan menjalankan backend check dan E2E bersamaan.
