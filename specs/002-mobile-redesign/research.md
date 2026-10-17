# Research decisions
- Next16 local docs: app/getting-started/03-layouts-and-pages, 04-linking-and-navigating; app/api-reference/file-conventions/dynamic-routes; functions/use-search-params. Params promises; routes thin server pages, client provider in root layout, Suspense for search params. URL query holds nonsecret selection/filter; no bearer storage. Re-fetch after mutation.
- API currently only available:boolean; add safe public status without customer IDs/reasons. Server clock authoritative. Proof via protected Blob/objectURL.
- Payment kind from all lifetime approved records, then filter aggregates. Full payment separate from DP to avoid misclassification. No business-rule change.
- E2E previously mutated lola_demo. New task requires lola_demo_test: dedicated test services and guard; no reuse3001. PHP APP_ENV=e2e so CSRF not skipped as in unit tests.
- One read-only research agent inspected docs/contracts; no external browsing, no copied code/licenses needed.
