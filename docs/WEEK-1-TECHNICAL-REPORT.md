# Week 1 technical report — Azure Ridge Sanctuary

Updated 13 November 2026. This is a technical implementation report, not a fabricated account of the student's personal learning.

## 1. Week 1 objective

Build a navigable, component-based foundation connecting guest inputs to authentic account storage and a genuine AI service. Preserve the existing resort experience. A pending request is not a paid or confirmed reservation.

## 2. User flow and five feature areas

1. Resort Homepage: introduction, photographs, rooms, dining, facilities, public information and floating assistant.
2. Guest Experience: registration/login, room browsing/details and five-step pending booking request.
3. AI Concierge: real Gemini conversation and a separate deterministic travel-planning form.
4. Guest Dashboard: private profile, bookings, payment status, enquiries and activity plans through the existing sidebar.
5. Resort Operations: approved-owner portal and Super Admin tools; front desk/housekeeping remain explicitly separate demonstrations.

See [USER_FLOW.md](USER_FLOW.md) for the Mermaid flow. These groupings reuse existing pages, not five new routes.

## 3. Google AI Studio

The existing `GEMINI_API_KEY` is securely configured. `src/routes/api/public/assistant.ts` calls Google's Gemini `streamGenerateContent` endpoint using `gemini-3.5-flash`, or server-configured `GEMINI_MODEL`. This update preserved the existing model and streaming behavior.

Setup: create a key in Google AI Studio, enable Gemini API access, configure billing/quota as required, and enter the key through Lovable's secure secret form. Never screenshot the key. Publish after changing production secrets/code.

Request: browser sends language and at most 20 messages, each up to 4,000 characters. The endpoint verifies origin and schema, retrieves approved partner listings through an anonymous `public_listings()` read, strips unexpected fields with `publicAssistantListingsSchema`, adds central demo catalogue and honest policy information, and streams generated text as newline-delimited JSON. Conversations stay in memory and clear on account change. Stop cancels work; explicit Retry handles failures. No private guest records enter Gemini.

Verified this update: actual endpoint and browser replies gave Deluxe Valley Room price 8,500 and capacity two and correctly reported zero approved partner properties. This proves genuine model access plus the empty public database read; it does not prove accuracy of future owner-supplied facts. Google AI Studio workspace screenshots must be supplied by the student with credentials hidden.

## 4. Forms and components

- `AuthForm`: required fields, international mobile, password strength/match, visible failures, Google and password-reset entry points.
- `BookingDialog`: date order, capacity, contact fields, total review, pending/test payment persistence. Prefill now uses the edited private profile, not stale Auth metadata.
- `GuestProfile`: private name/phone save feedback and summary synchronization.
- `EnquirySection` / `ActivitiesSection`: awaited private persistence and readback; enquiry email delivery is explicitly not claimed.
- Owner property/room forms: existing CRUD/photos, improved whole-number validation, upload/save interlock.
- `BookingsSections`: per-night seasonal totals, integer guest validation, in-flight status/save locks and affected-row confirmation.
- `PhotoManager`: removing a photo no longer deletes storage before saving; cancelling preserves the saved photo. Unused uploaded objects still need lifecycle cleanup.
- Admin settings/notifications now show save/loading/errors; audit/settings errors are surfaced. Value cards no longer imply collected payment revenue.

## 5. Database integration

The existing Lovable Cloud backend is healthy and remains attached; it was not replaced by an external project. It uses the existing generated database client. Twelve public tables remain, all RLS-enabled: `profiles`, `user`, `user_roles`, `guest_bookings`, `guest_state`, `business_owners`, `owner_properties`, `owner_rooms`, `owner_reservations`, `owner_notifications`, `platform_settings`, `admin_audit_log`.

Guest profile creation is triggered from Auth; `user` is a synchronized summary, not an authorization source. Owners require approval and can read/manage only assigned records. Super Admin checks happen in backend policies or authenticated server functions before privileged access. Listing photographs reside in a private 10 MB bucket with signed access.

New forward migrations `0007_week1_guest_validation.sql` and `0008_week1_owner_controls.sql` add validation/guards only, no tables or imported-data replacement:

- Guest inserts reject unknown demo rooms, invalid dates/capacity, forged nights/amount and invalid contacts; timestamps are preserved on cancellation.
- Saved plans/enquiries require arrays of objects, preventing malformed JSON from crashing rendering.
- Owner applications use a narrow boolean helper rather than failing open when settings are hidden by RLS.
- Owner reservations validate property/room/owner consistency and capacity, compute seasonal totals on the database, and reject overlapping confirmations beyond listed units using room locking.
- Partial property reassignment is blocked until dependent private photos/history can transfer safely.
- Reservation changes now enter the existing audit log.

Two initial attempted combined migrations rolled back (PL/pgSQL syntax; incorrect audit function name). Corrected, smaller migrations applied successfully. Existing schema/data was not deleted. Anonymous calls to the private applications helper are correctly denied; authenticated owner integration checks succeeded.

## 6. Technical implementation

React 19/TypeScript, TanStack Start/Router, Tailwind CSS 4, Query, generated PostgreSQL client, AI Elements, direct Gemini REST streaming and Vitest. `drizzle/schema.ts` is deliberately blank; SQL migrations, not ORM models, define schema. Key modules and environment/setup instructions appear in README.

## 7. Challenges and solutions

- Evaluator brief described an obsolete scripted assistant: current code already used Gemini; improved database grounding without duplicating chat.
- Booking validation was browser-only: added database enforcement and negative live tests.
- Seasonal stays charged only the check-in rate: summed individual occupied nights in UI/database.
- RLS hid the owner-applications setting from its trigger: narrowed access to a boolean helper, retaining settings privacy.
- Photo removal deleted objects even if a form was cancelled: changed removal to metadata-only.
- Unhandled client aborts previously appeared as crashes: existing cancellation handling and regression tests preserved.
- Placeholder signup email was rejected by the hosted account service: recorded the real error, never a success. Used temporary confirmed test accounts only for independent workflows and cleaned them up. Confirmation inbox delivery remains unverified.

## 8. What I learned — student reflection

Edit this section in your own words. Do not claim experiences you did not have.

- What I personally implemented: __________
- How React components and route navigation helped: __________
- What I learned about server-only credentials and Gemini streaming: __________
- How ownership rules and validation protect data: __________
- One bug I investigated and the evidence for its fix: __________
- My screenshots, commit references and contribution dates: __________

## 9. Completion status

**Implemented and verified:** guest login/session/profile update/logout, private booking/enquiry/activity persistence, booking validation, genuine Gemini answers/public catalogue read, seasonal owner totals and RLS separation, public routes/mobile guest navigation, existing cancellation tests.

**Partial:** full owner/admin browser coverage, production inventory concurrency under load, independent publish permission, room-edit reapproval, complete backend enquiry/plan semantic validation, cross-device merging, photo orphan lifecycle, staff shared data, invited-user password onboarding, full repository lint.

**External/manual evidence:** real email signup confirmation/recovery inbox, Google consent, approved owner/admin accounts for presentation, official resort contact/policies, student's reflection/AI Studio screenshots, final GitHub remote visibility and publishing.

**Not implemented:** live payments, automatic emails for enquiries, public partner booking checkout, shared staff operations. These are not represented as complete.

## 10. Future improvements

Scoped real staff operations, transactional guest/partner reservation integration, payment reconciliation, reliable email onboarding, atomic state mutations, AI abuse controls, photo lifecycle and full privileged-browser regression. Keep production operations distinct from Week 1 demo content.

See [evaluation checklist](WEEK-1-EVALUATION-CHECKLIST.md) and [implementation report](WEEK-1-IMPLEMENTATION-REPORT.md) for final test outcomes and remaining setup.