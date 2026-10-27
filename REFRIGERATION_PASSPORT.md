# Refrigeration Passport and equipment QR

Each existing Equipment Passport record has a private refrigeration profile,
service log and certificate attachments. Open Passport / QR on an equipment
card, or select it in the Refrigeration section. QR labels contain only the
marinequo.com equipment link; scanning still requires signing into the owning
account. This does not grant cross-company access or make certificates public.

Service records retain their original content; incorrect entries can be voided
and restored. Refrigerant additions/recovery require a type and positive kg.
Nominal charge is entered separately; no compliance certification or automatic
balance calculation is implied. PDF/JPEG/PNG/WebP certificate attachments have
a 5 MiB limit and a private Storage bucket. The broader RFQ attachment system
is unchanged. Use equipment in RFQ opens the existing draft editor, not a send.

## Deployment and rollback

Baseline backup: Git commit 8b5c6df71977e44ef3646a915e45340712de1e49.
The migration `private_refrigeration_passport` was applied on 2026-10-27;
`refrigeration-passport.sql` records its source and must not be rerun unchanged.
To roll back the interface, restore equipment-passport.js, passport.html,
index.html and sitemap.xml from the baseline. Keep new private tables/storage
so customer records are retained. New modules become unused.

## Validation

- Transactional database tests (rolled back): owner read/write, service event
  column permissions, document and Storage ownership, non-owner read/write denial.
- Private bucket verified: 5 MiB and the four allowed MIME types.
- Security advisors: no new warnings for these tables. Existing admin role
  helper and server-only rate-limit table advisories are unrelated.
- `refrigeration-passport.test.mjs`: QR decoded with jsQR, invalid dates and
  quantities, document signatures/limits, UI load/save, mocked storage upload
  and orphan cleanup, RFQ handoff, stale response after logout.
- Existing equipment and admin dashboard regression tests pass.
- Real authenticated browser certificate upload/download is not covered by
  these tests; it needs an owner session. No customer password or session was
  available during implementation. No production RFQ emails were sent.

Test dependencies: jsdom 26.1.0 and jsqr 1.4.0, installed outside the site.
Run `node refrigeration-passport.test.mjs`, `node equipment-passport.test.mjs`
and `node admin-dashboard.test.cjs` with those modules resolvable.

## Search visibility

Public home page title, description, Organization description and visible
English/Greek content now explain marine spare parts quotations, ship
refrigeration and marine HVAC. The sitemap date is updated. Private passport
remains noindex and account-protected. No meta-keywords tag, fake reviews,
unverified locations, or ranking promises. Search Console submission/indexing
and ranking are not implied by publishing these changes.

QR implementation: self-hosted qrcode-generator 1.4.4; MIT notice in
`equipment-qrcode-LICENSE.txt`. No external QR service receives equipment data.
