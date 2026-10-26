# RFQ attachments

Adds Attach Files to Instant Quotation and Vessel Passport without changing existing page styling or weather/news features.

- PDF, DOC/DOCX, XLS/XLSX/CSV, JPEG/PNG/WebP/GIF, ZIP.
- At most 5 files, 15 MiB per file, 20 MiB per request.
- Private existing `marine-rfq-attachments` bucket and `rfq_attachments` metadata table.
- Guest requests are stored in `guest_rfqs`, accessible only to Marine admins. Guest metadata uses `guest_request_id`; authenticated attachments retain `quotation_id` and `owner_id`.
- No direct browser writes to Storage or attachment metadata. The Edge Function validates extension, filename, size, file signatures and RFQ ownership before writing with a server-only service role key.
- Guest submission uses an HMAC-signed, IP-bound, expiring proof-of-work challenge, minimum form verification time, one-use proof, honeypot and persistent atomic IP/email rate limits. A proof-of-work check reduces automated abuse but is not a guarantee against determined bots.
- Files are never extracted or executed. Signature checks are not malware scanning; recipients should scan customer files before opening.
- Downloads use short-lived signed URLs for the owner or admin. Notification emails to info@kontesmarine.com have private download links valid for 24 hours. Requests remain visible in the admin portal if email fails; the sender is told if notification is unconfirmed.
- Portal upload retry retains both quotation and batch IDs and does not create another quotation. A concurrent upload to the same quotation is rejected for 60 seconds.

## Backend source

`rfq-attachments-backend.zip` contains deployed function sources, the SQL schema changes, validation tests and the previous SUBMIT-RFQ function for recovery. Functions use pinned supabase-js 2.57.4; no service key is included. Runtime secrets are read only from Supabase environment variables.

`rfq-submit-v2` accepts guest multipart submissions and authenticated quotation attachments. The existing `SUBMIT-RFQ` endpoint is restricted to verified quotation owners for notification. It reads request contents from the database rather than trusting email body fields supplied by the browser.

## Validation (2026-10-26)

- Actual deployed guest upload of valid PDF, XLSX, DOCX, PNG and ZIP: 5 Storage objects, 5 matching metadata rows, email provider accepted notification.
- Replayed verification: HTTP 409.
- Anonymous metadata access: HTTP 401; public private-file URL: rejected; hostile Origin: HTTP 403; unauthenticated portal upload: HTTP 401.
- Node tests: accepted formats, unsupported executable, empty/oversized files, file count, total size, path traversal, mismatched binary signature and renamed HTML.
- DOM tests: picker/list/removal controls, multipart submission, reset and error handling; portal partial-failure retry uses the same RFQ/batch and authenticated email request.
- JavaScript syntax and HTML IDs checked. No existing customer login was used; a full signed-in production session and real mobile-device upload remain to be checked.

## Recovery

Frontend backup branch: `backup-before-secure-uploads-20261026` (804c746). Integration also preserves subsequent bulletin changes from 3ae38ff. Reverting frontend alone requires restoring the backed-up SUBMIT-RFQ function if reverting to its legacy unauthenticated email requests. Schema additions can be left in place; do not drop guest request tables while they contain customer submissions.
