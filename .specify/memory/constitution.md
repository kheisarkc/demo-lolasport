# Lola Sport Constitution

Version: 1.0.0. Ratified for local technical setup: 2026-10-18.
This is a technical working agreement. It does not claim approval of business requirements by the problem owner.

## I. Evidence and scope
The supplied proposal is the baseline source. Separate documented facts, assumptions, proposals, and measured results.
Keep Laravel and Next.js. PostgreSQL is the selected database. Stay within reservation, manual payment recording, and operational/financial information unless scope is explicitly changed.

## II. Single ownership of business rules
Laravel owns authorization, reservation concurrency, payments, reporting, and persistence.
Next.js is the presentation layer. Do not duplicate transactional decisions in the frontend or expose database credentials there.
Use exact monetary representation, explicit time boundaries, separate booking/payment status, and transaction-safe concurrency controls when those features are implemented.

## III. Requirements before dependent implementation
Resolve material operational rules with the owner before activating behavior that depends on them.
Small technical choices can be made autonomously and documented. Do not stop unrelated local work for a blocked dependent feature.

## IV. Verification
Require meaningful tests for business rules. Test PostgreSQL-specific behavior on PostgreSQL, especially overlapping and concurrent bookings.
Keep the test database isolated. Verify browser flows and role boundaries. Report checks that actually ran, failures, and untested behavior.

## V. Local autonomy and human authority
An authorized implementation task includes its local planning, code, fixes, checks, and handoff.
Do not ask for repeated internal-stage approval when the user has already authorized the bounded task.
Deployment, production access, destructive data operations, force push, payment changes, and customer-data changes require explicit authorization.
Do not bypass sandbox/approval controls, create unrequested schedules, or fabricate stakeholder sign-off or UAT.

## VI. Maintainable context
Persist feature specs, plans, tasks, decisions, and verified status. Keep instructions focused and load relevant skills on demand.
Spec Kit is the primary workflow. Supplemental skills must obey this constitution and user instructions.
Changes that affect scope, data integrity, architecture, or academic claims require an explicit decision record.
