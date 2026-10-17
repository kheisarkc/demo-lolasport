# Data model
- users name/email/password, role customer/staff/owner; role tidak boleh diisi registrasi.
- courts name/sport/hourly_rate integer positif/open_hour/close_hour/active.
- bookings court_id/customer_id nullable/customer_name/source website|walkin|block/start/end UTC/hourly_rate snapshot/total/minimum_dp/status/expires_at/reason.
- payments booking_id/amount integer positif/method transfer|qris|cash/status pending|approved|rejected/proof_path privat/submitted_by/reviewed_by/reviewed_at/rejection_reason.
- audit_events booking_id nullable/actor_id nullable (system)/action/metadata JSON/created_at.
- Rentang [start,end), end > start; pending/review/confirmed menahan slot. Blok total nol, tanpa pembayaran. Tidak hard delete.
