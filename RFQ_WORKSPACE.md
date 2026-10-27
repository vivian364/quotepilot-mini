# RFQ workspace upgrade — 27 October 2026

Backup: `backup-before-rfq-workspace-20261027` (baseline ed256c9).
Both Instant Quotation and Vessel Passport load the same reviewed-parts and company-branded RFQ module. File extraction opens an editable table. Explicitly apply reviewed rows before pricing or exporting the preview. Missing quantities are blocked. Original extraction remains available for comparison; OCR is not guaranteed to identify every line.

The company logo is a local PNG/JPEG/WebP, maximum 2 MiB and 12 megapixels, re-encoded to PNG at maximum 1200 px. It stays in the current form, clears on reset/sign-out, and is not persisted in a shared profile. RFQ preview includes company name/logo, vessel, port, country, date, parts and notes. Print / Save as PDF uses the browser print dialog. To submit the branded document, save and attach that PDF using existing private Attach Files. This is an RFQ, not an approved offer.

Admin: Private settings → Private country price lists. Enter real base costs, exact manufacturer/part, country and expiry. Save updates the same country/manufacturer/part; Disable is reversible. Case-insensitive exact identifiers are used; no cross-country, fuzzy or currency-converted catalog prices. Catalog values are private with admin-only RLS. Valid rows take priority over Google, including countries without Google Shopping (e.g. Mauritius). Existing configured 10–15% uplift applies once. Google remains fallback for supported markets. No sample commercial prices were installed.

Backend archive contains deployed Edge Function source, additive schema and tests. Existing proof-of-work, one-use proofs and rate limits remain active. No production RFQ notification was sent for this upgrade's tests.

Validation before publication: ten pricing/batch unit tests; editable-table/quantity/injection DOM checks; mocked edge catalog priority/filter/markup checks; real transactional RLS anonymous/non-admin/admin isolation with fixtures rolled back. Live existing PDF reader correctly extracted Schneider A9F74116 quantity 2 and Danfoss KP35 quantity 3. Logo/render/print interaction verification follows publication.

## Registered customer directory
Private settings includes Registered customers (admin only), 50 accounts per page, page filter, company/contact/email, registration date and email confirmation status. A dedicated Edge Function validates the current JWT with getUser, checks admin_users on every request, and returns only these fields. No service key reaches the browser. Profiles with no company are labeled incomplete. Anonymous guest RFQs remain separate. Missing/invalid token and non-admin denial tested before any Auth directory access.

Live verification: company logo upload and two-item RFQ preview rendered correctly on marinequo.com. Browser print action invoked; final OS Save as PDF dialog is not observable in the remote browser. Protected live catalog fallback for Mauritius passed with no provider lookup or RFQ email.
