# Belle N Beast — India Talent Hunt 2027

Responsive luxury editorial landing page built with plain HTML, CSS and JavaScript. The application form opens in a popup; the ₹850 event-service fee is collected with **Razorpay** and a **registration ID** is issued once the payment is verified on the server (Netlify Functions). There is still no database, booking engine, QR validation or notifications.

## Razorpay payments & registration ID

**Payment mode switch** — on the first line of `index.html`:

- `<html lang="en" data-pay-mode="demo">` (current): **dummy Razorpay checkout**. Runs fully in the browser, needs no keys or server, charges **no money**. You can pick UPI/card/net banking/wallet, pay, or click "Simulate a failed payment". After paying, a registration ID is issued and the confirmation is labelled "Test payment · no money charged". "New registration" starts again. Works even when opening `index.html` directly.
- `data-pay-mode="live"`: real Razorpay via the Netlify Functions below (set the keys first).

How it works (live mode):

1. The applicant completes the 4-step popup form and clicks **Pay ₹850 & register**.
2. `netlify/functions/create-order.js` re-validates the details, generates a registration ID (e.g. `BNB27-MOD-AEUMQVT`) and creates a Razorpay order for **₹850 (fixed on the server)**. The ID and applicant details are stored on the order (`receipt` + `notes`).
3. Razorpay Checkout opens (UPI, cards, net banking, wallets).
4. `netlify/functions/verify-payment.js` checks the payment signature (HMAC-SHA256 with your secret), then fetches the order and payment from Razorpay to confirm the amount and status.
5. Only then does the popup show **"You're registered"** with the registration ID, payment ID, copy and print buttons. The confirmation is kept in the browser so it reappears if the applicant reopens the popup.

Setup:

1. Deploy this folder to Netlify (the included `netlify.toml` publishes `.` and deploys `netlify/functions`). No npm install is needed.
2. In Netlify → Site configuration → Environment variables, add:
   - `RAZORPAY_KEY_ID` — e.g. `rzp_test_…` (start with **test mode** keys)
   - `RAZORPAY_KEY_SECRET` — the matching secret. **Never** put this in `script.js` or any public file.
3. Redeploy, then make a test payment (Razorpay test UPI/cards). Check the order in the Razorpay dashboard — its notes hold the registration ID and applicant details.
4. Switch to live keys (`rzp_live_…`) only after the legal checks below are done.

If the functions live somewhere else, set `<html data-pay-api="https://your-api.example.com/path">` and the popup will call `create-order` and `verify-payment` there.

Find a registration: Razorpay dashboard → Orders → search by receipt (= registration ID), or Payments → open a payment → Notes.

Not yet included (recommended next): a database for registrations (today Razorpay is the record), confirmation email/WhatsApp, a Razorpay **webhook** (`payment.captured`) so registrations are recorded even if the applicant closes the tab before verification, and refunds handling. Portfolio files chosen in the form are still not uploaded.

## Open and deploy

- Open `index.html` in a browser, or serve with `python -m http.server 8000` from this directory.
- Deploy to Netlify by placing these files in your publishing directory, or add the folder under the main site as `/india-talent-hunt/`.
- Files: `index.html`, `styles.css`, `script.js`, `privacy.html`, `terms.html`, `assets/`, and `single-file-preview.html` (convenient standalone preview with inline CSS/JS; draft legal pages still live beside it in the ZIP).
- No Node/npm build required. Internet access is needed for Google Fonts and the Unsplash demo photography; locally bundled SVG visuals are included as image fallbacks.
- The brand wordmark is typographic. Replace with an approved official vector logo if available.

## Confirmed organiser-provided information

- Campaign: India Talent Hunt 2027.
- 20 cities simultaneously, 1–7 January 2027.
- Models, fashion designers, photographers/videographers, beauticians.
- One-round profession-specific practical audition; selection may occur at event, result communication targeted within 3 days.
- 21+ and passport required for overseas employment consideration; freshers welcome.
- Direct full-time employment by Belle N Beast for selected candidates, subject to formal offer and applicable rules.
- Proposed AED salaries vary by profession but amounts are **TBD**.
- Organiser states it will arrange visa, flight, accommodation, transport, medical insurance for selected employees. Specific terms are **TBD**.
- Organiser-provided legal name: Belle n Beast Media & Advertising Services, Dubai Mainland DED, since 2018; office: 309, 3rd Floor, Al Attar Grand Building, Bank Street, Dubai, UAE. No licence number was provided.
- Venue publication planned seven days before the event, with communication via WhatsApp/email once integrations exist.
- Event-service fee ₹850, including venue, audition, refreshments/water and beauty assessment kit; collected via Razorpay. Cancellation refund terms are labelled **draft** on the page.

## Working demo functionality

- Responsive desktop/tablet/mobile layout with mobile navigation and sticky mobile CTA.
- Four clickable profession cards preselect the application category.
- 20-city searchable grid; clicking a city preselects the application city.
- Four-step application form in a popup (opened by every Apply button and the city tiles) with accessible validation and professionally tailored fields, followed by Razorpay payment and a registration ID.
- Age is checked against the chosen 2027 event date: 21+ required.
- Date preferences limited to January 1–7, 2027; morning/afternoon/evening are preferences, **not** confirmed appointment times.
- Portfolio file selection with local-only size/count checks; **never uploaded**.
- Review of entered details, fee/terms disclosure, Razorpay checkout, server-verified registration ID with copy/print.
- Native keyboard-accessible FAQ accordions, draft privacy and event terms.

## What must NOT be assumed live

- Application details are stored only on the Razorpay order (notes); there is no separate database and no email is sent.
- No QR pass is generated and no time slot is reserved. Payment and registration IDs work once Razorpay keys are configured.
- No portfolio or ID document is uploaded.
- No false 'successfully registered' messaging appears.
- The site uses illustrative stock imagery and original SVG fallback art, **not verified Belle N Beast staff or client work**. Replace images with company-approved/licensed originals before launch.

## Required before production

1. Verify legal entity licence, validity and relevant manpower activity, and publish accurate permitted proof.
2. Verify the applicable Indian overseas recruitment permission or registered recruiting-agent arrangement. A Dubai manpower licence is not necessarily an Indian direct recruitment permit.
3. Obtain documentary approval from qualified Indian and UAE advisers for the **actual proposed ₹850 fee model**; avoid making audition/event payment a condition of being considered for employment. Indian MEA guidance for foreign employer recruiting Indian workers and the UAE legal ban on charging workers recruitment/employment costs must be addressed.
4. Publish final legally approved event/refund terms and privacy/data protection notices. Obtain appropriate consent and data processing protections.
5. Publish 20 venue addresses, city/date-specific time slots, actual booking capacities and accessible check-in arrangements.
6. Confirm vacancy numbers, AED salary ranges, required qualifications, benefits and formal UAE employment contract terms.
7. Supply official support email/phone and social/GMB links.
8. Connect a secure backend with encrypted database, private portfolio storage, applicant auth/OTP if appropriate, bot prevention, rate limits, role-based admin dashboard, audit logs and retention schedule.
9. Connect a legally approved Indian payment gateway only after clear approval; verify payment via **server-side gateway webhooks**, never frontend redirects.
10. Generate unique unguessable signed QR codes only for verified confirmed bookings; implement server-side scan/attendance and prevent duplicate re-entry.
11. Implement explicit opt-in for WhatsApp and email notifications, validate business template compliance and include event-change alerts.
12. Install privacy-conscious GA4/Meta/Google conversion tracking only after policy, consent and testing, with no passport data or raw portfolio contents sent to ad platforms.
13. Load-test for up to ~2,000–3,000 anticipated candidates per city per day; 20 simultaneous cities imply potentially 40,000–60,000 daily visits to the events, while booking volume may differ.
14. Get actual image licences/permissions. Verify photographs and brand claims.

## Illustrative Unsplash images

Photo URLs in `styles.css` currently load remotely. They are intended for layout only; replace them with authorised campaign assets. Local `assets/editorial-hero.svg` and `assets/editorial-card.svg` ensure visual fallback when network photography is unavailable. Final assets should be optimised WebP/AVIF and served locally or through a configured image CDN.

## Editing schedule

Dates are hard-coded in `index.html` and the age validation in `script.js`. If the event schedule changes, update both, the FAQs, event terms and marketing copy together. The city list and category-specific inputs are maintained in `script.js`.
