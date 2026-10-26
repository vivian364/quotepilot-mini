# Equipment Passport and Scan & Request

`equipment-passport.js` mounts inside the authenticated Vessel Passport workspace.

## Data and privacy

- Records live in `public.vessel_equipment`, linked to `vessels` and the authenticated owner. RLS checks both the record owner and vessel owner on reads, inserts and updates.
- No anonymous access or DELETE permission is granted. Archive/restore is reversible.
- Descriptive OCR text is stored only when the user saves a reviewed equipment record. A photo stays in browser memory until the user chooses to attach and submit an RFQ. The normal private attachment pipeline handles RFQ photo uploads.
- The OCR worker and English language data download from jsDelivr. Recognition runs in the browser. No image is sent to an AI or OCR API.
- OCR is transcription, not part recognition, compatibility checking, specification certification or a price quotation. Every draft requires user confirmation and manual submission.

## Integration

Import `mountEquipmentPassport`, instantiate it after the portal state variables and existing attachment helper, pass `db`, `getState` and `getAttachments`. Call `sync()` after workspace loading; call `reset()` on sign-out. Do not expose the Supabase service key.

## Verification

- `node equipment-passport.test.mjs`: conservative label parsing, ambiguous serial characters preserved, unknown labels not guessed, field/file limits, RFQ draft content.
- Actual Tesseract.js 7 OCR against a synthetic printed nameplate: manufacturer, model, serial and part number match (overall OCR score 94).
- Database tests run within a rolled-back transaction: own insert/read/update/archive succeeds; cross-vessel insert, owner reassignment and cross-account read fail. Synthetic users/vessels/equipment do not persist.
- Supabase security advisors: no new equipment-table finding. Existing findings outside this feature are unchanged.
- Full authenticated browser save/scan/attachment submission still requires a signed-in account; do not describe this as verified until completed.

## Backup

Existing site source remains in Git history. The schema is additive; existing tables, requests, prices, attachments and authentication behavior are preserved.
