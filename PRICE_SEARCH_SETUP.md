# Google price search — active configuration

Google price search for Instant Quotation and Vessel Passport. Provider credentials are stored privately in Supabase Edge Function secrets. Default uplift: 15%.

## Pricing rule

Default 15% uplift over the matched public market price, adjustable by Marine admins from 10% to 15%. EUR 100 becomes EUR 115 at 15% or EUR 110 at 10%. This is a cost uplift, not a gross-margin percentage. Round up to cents. Public estimates include only the resulting customer price; source cost, supplier and uplift remain in admin-only RLS tables.

A public listing is a market reference, not a confirmed wholesale purchase price. The result is indicative per listed unit/package; VAT, freight, availability and suitability still require confirmation. No currency conversion, invented prices or automatic orders.

## Connection and recovery

1. Obtain a SerpApi API key for its Google Shopping API. Review provider terms and any fees yourself; no subscription or billing has been enabled by this implementation.
2. In Supabase project MARINE QUO, add an Edge Function secret named `SERPAPI_API_KEY`. Never put the key in frontend code or send it in chat.
3. Deploy/merge the prepared frontend branch after a real query succeeds.
4. Sign into the Marine admin account, open Price search → Private settings, set the uplift from 10 to 15 and enable live search. The API defaults to disabled until explicitly activated.

Backend function `rfq-price-search` and SQL settings/audit tables have been installed. GET returns only a readiness boolean; configured:true was verified. Live search has been enabled with 15% uplift. The connected provider is on its free 250-search/month plan; no paid plan was selected. Searches stop when provider quota is exhausted.

## Matching and privacy

One manufacturer and exact model/part number at a time. Google Shopping results are supplied through the SerpApi API. Accept only exact normalized title matches, EUR prices and HTTPS references. Reject other models, installments, used/refurbished items and explicitly compatible/replacement listings. Unmatched requests show Price on request. Google Shopping coverage of industrial/marine spares is incomplete; no estimate is guaranteed.

Only manufacturer and product code are sent to the provider. RFQ attachments, company details, email addresses and vessel details are not sent. All output is rendered as text. Source prices/URLs are stored in `rfq_price_estimates`, readable only by Marine admins. `rfq_price_settings` is editable only by Marine admins. Guests receive marked-up price only, with an estimate ID and timestamp.

## Abuse limits

Reuse the existing HMAC-signed expiring proof-of-work verification, bound to a request ID and IP; consume each price proof once. Persistent limits: 5 queries per IP per hour and 100 globally per UTC day. Provider failure, no API key, disabled setting or failed audit storage must not return an estimate. API credentials stay server side.

## Validation

Four Node test groups passed: percentage limits/rounding; exact product matching; reject wrong currency/used/installments/insecure URLs; prevent source-cost/markup leaks in the public response. DOM test passed: display EUR 115 for a mocked EUR 100 source at 15%, add estimate reference to RFQ, and clear stale estimate when provider is unavailable. All inline JavaScript and new module syntax checked. Real Google Shopping query passed for Schneider A9F74116: source EUR 66.52, 15% uplift, resulting customer price EUR 76.50. Audit record b1d9e052-47bf-423e-b061-e2bbead54d79 confirms the server calculation. Unmatched Danfoss queries correctly returned Price on request. Public response contained no source price, markup or supplier URL.

## Files

`rfq-price-search.js` mounts the price widget and admin controls. `index.html` loads the module; `passport.html` initializes private settings for Marine admins. `google-price-search-backend.zip` contains the deployed backend, schema and Node tests. Existing attachments and submission endpoints are preserved.
