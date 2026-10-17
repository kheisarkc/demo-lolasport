# API and UI contracts
GET /api/v1/courts: existing fields plus server_now ISO, each slot status available/booked/blocked/past. Public response must not expose booking/customer identity. blocked/booked take precedence over elapsed for occupied slots.
GET /api/v1/bookings/{id}: existing authorized detail plus server_now. Other ownership/role behavior unchanged.
GET /api/v1/reports: existing owner-only fields plus transactions[].kind and totals_by_kind {dp,settlement,full}. Sum categories=total; full lifetime approved history determines kind. Invalid ranges422.
UI URL routes separate customer/staff/owner. Selection query sanitized; local next allowlist. Unauthorized UI gives recovery without granting API access. Protected proof fetched as Blob using same session; revoke object URL.
