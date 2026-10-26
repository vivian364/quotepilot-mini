# Country-based batch price search

Active on MARINE QUO Instant Quotation and Vessel Passport. Provider credentials remain in Supabase Edge Function secrets; no private key is included in this repository.

## Customer workflow

Choose the delivery country, paste up to 50 rows from Excel or import a CSV/TSV file up to 1 MB. Format: `Manufacturer; Part number; Quantity`. Excel tabs, comma-delimited CSV, semicolons, header rows and quoted fields are supported. Copy the three relevant columns from .xlsx; the ordinary RFQ attachment feature still accepts Excel, Word, PDF, photos and ZIP separately.

Recognized delivery ports suggest a country, including Piraeus, Singapore, Rotterdam, Hamburg, Dubai, Houston, Port Louis and Shanghai. The country remains visible and explicitly selectable. Search uses that country's Google Shopping domain, country code and location; it never silently substitutes another country. Countries without supported Google Shopping coverage, including Mauritius and mainland China, produce Price on request for a local manual quotation.

Each line shows quantity, marked-up unit price, line total and status in the selected market's currency. The subtotal includes priced lines only and clearly states how many lines it covers. Unmatched, unavailable and unsearched lines remain visible. Two searches run concurrently; Stop prevents new searches from starting while active ones finish. Duplicate product codes in one batch share a lookup. Export CSV includes every line and status; Add full list to RFQ transfers the entire list, quantities, country and estimate references.

## Pricing and access

Default uplift is 15%, configurable by Marine admins between 10% and 15%. This is a markup over a public market reference, not a guaranteed wholesale purchase price or gross-margin calculation. Round up to the local currency's minor unit. Unit price times quantity produces the line total. No exchange-rate conversion is performed. Reject wrong currencies, other model numbers, installments and used/refurbished/explicit compatible-replacement listings.

Prices are indicative per listed unit/package. Taxes, freight, delivery to a vessel, availability and technical compatibility require confirmation. Search localization does not prove local stock or a seller's warehouse location. No orders or stock reservations are placed automatically.

Public responses contain only selling prices, quantities, country/currency and estimate IDs. The source price, supplier link and markup are available only to Marine admins through RLS-protected settings/history. Latest 100 estimate records appear in the admin history. All outputs use text rendering; CSV exports neutralize spreadsheet formulas.

## Backend

- `rfq-price-search` validates the signed, IP-bound, expiring one-use proof, manufacturer/part, selected market and quantity, then searches through the connected SerpApi Google Shopping API.
- The same HMAC proof mechanism is reused from existing RFQ submission. Limits: 60 lookups per IP per hour, 100 globally per UTC day, plus existing challenge limits and the provider's own account quota. The connected account is on the free 250-search/month plan; no paid plan was enabled. One different product lookup can consume one provider search; provider caching may avoid charges against quota.
- `rfq_price_estimates` stores country, currency, quantity, line total and source/selling prices privately. Existing EUR records default to Germany; no historical prices are converted.
- `rfq-submit-v2` accepts up to 20,000 product-description characters to fit bulk lists. Attachment limits remain 5 files, 15 MiB each and 20 MiB total; the bounded request reader allows 256 KiB of multipart metadata. `validation_only:true` validates without inserting an RFQ, uploading files, sending email or returning a successful-submission receipt.
- `rfq-price-markets.mjs` is the public market/list/CSV helper. Its backend copy is packaged with the deployed function. Backend source, migrations and tests are in `google-price-search-backend.zip`.

## Verified

Node tests passed for parsing Excel/CSV/TSV, 50-line bounds, quantities, exact part matching, incompatible currencies, private cost fields, 10–15% markup, zero-decimal currencies, totals, unsupported countries, port suggestions and CSV safety. DOM tests passed for two-worker queue, duplicate reuse, partial subtotals, missing lines, cancellation, full RFQ transfer and wrong-country/currency rejection.

Real country tests passed for Schneider A9F74116: Germany EUR 76.54 x 2 = EUR 153.08; United Kingdom GBP 64.09 x 3 = GBP 192.27, each including server-side 15% uplift. Prices are time-specific examples, not a permanent price list. DB audit records f912a433-af72-4400-8a18-18c282d085e6 and aba3390e-493e-4db4-89bc-2fd50feca2ac confirm country, currency, quantities and calculations.

A 50-line, 6,059-character request passed the deployed validation-only path. A database transaction accepted 19,000 characters and was rolled back. This test did not require an email notification. Existing analytics, craft categories, registration fields, attachments, notifications and weather/news placement are preserved.

## Recovery

Pre-pricing backup: `backup-before-google-prices-20261026`. The single-item price implementation is retained in commit 6d7a26b. Later craft/account changes are preserved from main before applying the batch module. Disabling `rfq_price_settings.enabled` stops live search without affecting ordinary RFQ submission.
