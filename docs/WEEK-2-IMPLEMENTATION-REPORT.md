# Week 2 — Build + Connect implementation

## 1. Existing screens improved

Home, public Rooms, guest Dashboard, owner/admin portals, authentication and information pages reuse the shared navy (#142B45), teal (#159A91), gold (#E5AD55), off-white (#F5F7FA) and white-card theme. Existing photographs, serif/sans typography, URLs and features remain. Shared cards, buttons, page headings and sidebar emphasis are more consistent. Staff screens now explicitly identify sample operational data.

## 2. New functionality

- Approved database rooms appear before the preserved, clearly labelled sample catalogue on public Rooms and Dashboard Rooms.
- Room cards show type, nightly rate, capacity and request eligibility; signed-in guests can submit a booking request.
- The existing booking dialog handles both sample and database rooms without duplicating its form.
- Database requests calculate seasonal/discounted totals per night and return a genuine saved reference.
- Guests see only their partner requests, with refresh persistence and cancellation. Owner decisions refresh in the guest view every 15 seconds.
- Guest Overview displays private total/pending request counts plus aggregate available/occupied partner units today. Counts do not use operational sample data.
- Public inventory and owner/admin data refresh periodically; existing owner acceptance, notifications and audit triggers are reused.
- Gemini account changes invalidate old requests and clear draft/transcript state, preventing stale answers after identity changes.

## 3. Database tables and fields used

No duplicate tables were created and existing data was not removed.

| Table | Relevant fields |
|---|---|
| `owner_properties` | `id`, `owner_id`, name/kind/description/location, amenities, check-in/out, photos, approval status |
| `business_owners` | `user_id`, approval status and existing permissions |
| `owner_rooms` | `id`, property/owner link, name/type/description, capacity, facilities/photos, price, seasonal price/start/end, discount, units, available |
| `owner_reservations` | property/room/owner links, guest contacts, dates, guests, amount, status, notes; new nullable `guest_user_id` account link |
| `profiles`, `user`, `user_roles` | Existing private profile/account summary and protected authorizations |
| `guest_bookings`, `guest_state` | Existing sample-stay requests, activity plans and enquiries, scoped to the guest |
| `owner_notifications`, `admin_audit_log` | Existing notification and audit triggers reused |

`public_listings()` projects approved property/owner records with safe room fields and aggregate occupied unit counts. `request_partner_stay()` derives identity, owner, property, initial status and amount inside the database. `my_partner_stays()` projects only the caller's safe booking details; it excludes internal notes, guest contacts and owner identifiers. `cancel_partner_stay()` permits only the caller's eligible request cancellation. Anonymous execution is prohibited for guest functions; no broad guest read/update policy was added to owner reservations. Owners cannot forge or reassign guest linkage.

## 4. Booking flow

Home → Explore Rooms → approved room → sign in if needed → dates/count → guest details → review → no-payment acknowledgement → submit → actual saved reference/amount → Dashboard My Bookings → reload/cancel.

Dates, bounded contacts and integer guest counts are validated in the client and database. The database requires an approved property and owner, open room, capacity compliance, a future stay of 1–90 nights and remaining confirmed inventory for every night. Requests do not hold units or imply owner acceptance. Existing confirmation safeguards remain. Sample stays keep their prior pending/test-payment flow. No payment success is fabricated.

## 5. Gemini connection

The existing same-origin `/api/public/assistant` streams Google Gemini with server-only credentials, central sample facts, policy information and anonymously projected public database listings. Loading, Stop, error and explicit Retry remain. The assistant cannot read or modify private reservations.

**Current live verification:** Google initially returned HTTP 503, then HTTP 429 on explicit retry. Subsequent live checks returned HTTP 200 with genuine streamed text. Recoverable provider/configuration failures now use explicit NDJSON error events rather than page-level failing HTTP responses; validation/auth errors still retain their HTTP error status. Controlled outage/retry preserved Home and recovered without runtime errors. Provider quotas/service availability can still interrupt answers; no credentials were replaced or exposed.

## 6. API integrations

- Working: database/Auth operations, approved catalogue reads, guest requests/readback/cancellation, existing owner/admin queries and signed-photo integration.
- Working on subsequent live checks: Google Gemini; transient service/quota errors remain explicitly handled.
- No Python source, Python dependency manifest or configured Python endpoint was found; no endpoint was invented. Provide an existing service URL and contract if Python output is required.
- Live payment remains unconfigured and no money is collected.

## 7. Verification

- **46 tests passed in 9 files**, including live guest/owner privacy, forged price/payment rejection, seasonal pricing, overlap protection, draft exclusion, guest linkage spoof prevention, own-only read/cancel and inventory calculations.
- Browser used isolated temporary confirmed guest/owner fixtures, then removed them: real sign-in, approved-room request, overcapacity error, ₹22,500 seasonal-boundary total, request saved and displayed after refresh, cancellation, public catalogue controlled outage/retry, mobile overflow checks and Gemini failure/retry.
- Desktop 1280×1800 and mobile 390×844 screens inspected; no page runtime errors recorded.
- Automatic app build passed. Targeted lint on formatted booking/assistant/new data/tests passed. Repository-wide historical formatting debt was not addressed.
- Existing content-route metadata inspected; all content pages retain app-specific titles/descriptions and social metadata. Assets are bundled, so no placeholder image URLs were added.

## 8. Pending configuration and limits

- No production approved partner properties currently exist. An authorized Super Admin must approve genuine owner/property records; no permanent sample listings were inserted.
- Gemini provider quota/service fluctuations can still prevent an answer; they now remain inside chat, without page-level crash handling.
- Python endpoint/contract is absent.
- Live payments, verified official resort contacts/policies, real-inbox email recovery/confirmation and full Google consent remain outside what was verified.
- Front Desk and Operations remain clearly disclosed local demonstrations, not a shared operational integration.
- Full production owner/admin browser regression and historical repository lint debt remain.
- Publish the updated app to deploy these changes to the live URL.