# Week 1 technical improvement report

## Scope and provenance

This report records the current implementation and the verified improvement work on 13 November 2026. It is not a claim that every existing feature was developed during the internship's first week, nor a fabricated first-person learning diary. The student should add their own actual learning experience and chronology before resubmission.

## What the project contains

Five feature areas: public resort information; guest registration/browsing/booking requests; assistant and personalized travel planning; private guest Dashboard; protected owner/front desk/operations/admin experiences. The user flow is documented in USER_FLOW.md. Existing layout, Home photography and navigation remain in place.

## Improvements in this update

- Replaced AssistantWidget keyword matching and predefined answers with direct, streamed Gemini API calls.
- Selected `gemini-3.5-flash` from successful authenticated model discovery; stored `GEMINI_API_KEY` securely through the secret form.
- Catalogue grounding excludes private guest records and identifies demo prices/inventory and unconfirmed policies.
- Preserved language selection and quick actions as genuine model requests; added session context, loading, Stop, explicit Retry and failure messages.
- Used installed AI Elements transcript, message and composer primitives inside the existing floating panel.
- Fixed silent guest-state writes: full enquiry data is saved, saving is awaited, failures are visible, saved enquiries can be retrieved on screen.
- Activity save/remove now wait for confirmed writes and display success/failure. Account activity plans are no longer incorrectly described as local-device demo storage.
- Added profile save confirmation, guest-data loading errors and tests for complete enquiry/plan readback, owner-only profile updates, account-summary synchronization and assistant validation/refusal handling.
- Replaced generic README and added the user flow and evidence checklist.
- No new tables, migrations, permission policies or auth provider changes were introduced.

## Data and permissions

Read-only schema inspection confirmed 12 public tables, all with RLS enabled. Existing SQL migrations describe the actual tables, profile lifecycle triggers, owner permissions, listing approvals, private photo paths, public listing projection and audit logging. Guest requests use guest_bookings; profile editing uses profiles and existing user-summary triggers; enquiries/plans use guest_state. Operational samples remain separate local/in-memory demonstrations. The README maps each source file and data source.

## Validation and security

Existing signup checks name, email, country-coded phone, password strength and confirmation. Booking/enquiry forms validate dates and guest counts. Enquiry submission saves all validated fields. Activity plans require a future/today date, 1–12 people and a listed slot. Assistant input is bounded to 20 messages and 4,000 characters/message and requires a final user question. Public chat never obtains private records. Passwords stay in Auth. Staff roles cannot be self-assigned; test-payment requests cannot be marked paid by guests.

## Verifiable checks

- Google model listing: HTTP 200; selected model present.
- Live assistant endpoint: streamed correct ₹8,500/night, 2-person Deluxe Valley Room information and explained that saving is not payment or reservation confirmation.
- Browser assistant: rendered actual Gemini room-pricing answer and confirmation caveat. A controlled 503 response displayed an error; explicit Retry returned a real answer. A follow-up asking which previous option fits five guests correctly selected Ridge Family Suite (₹14,500). Desktop and mobile assistant captures were inspected.
- Existing public Rooms, Policies, Directions and Signup routes loaded.
- Temporary confirmed guest signed in using the existing form; refresh retained the session.
- Full enquiry saved through UI and message read back after page reload.
- Activity plan saved through UI and read back after reload.
- Profile name edited through UI and read back after reload.
- Mobile 390-pixel viewport had no horizontal overflow; existing account menu sign-out returned to Sign In. No browser runtime errors were captured.
- Vitest: 20 tests passed (5 files), including 7 live private-data integration checks. Temporary test accounts and their owner-scoped data were cleaned up.
- Latest automatic TypeScript/production-build log: build OK.
- Full lint was executed and failed on repository formatting rules: 2,138 formatting errors and 18 warnings at the first run, including substantial existing unformatted source. Changed-file lint passed with warnings only after targeted formatting; unrelated source is not rewritten.

## Challenges and resolution

- The old assistant was scripted, not model-backed: replaced only that assistant with server streaming and real grounding.
- Previous guest-state persistence returned success before database completion and dropped enquiry messages: writes now wait and save complete fields.
- Concurrent writes inside one mounted app could overwrite each other: a serial queue and account/loading guards preserve sequential writes. Cross-device conflicts remain a limitation.
- AI Elements expected an absent compact icon button size: added the missing variant without changing existing variants.
- Initial automated clicks happened before client hydration: browser verification waited for interactivity; this was a test timing issue, not a backend failure.

## Learning discussion prompts (student to complete honestly)

Describe what you personally learned about server/browser separation, streaming events, validation, RLS ownership, profile triggers, async persistence and truthful demo boundaries. Cite your own screenshots/commits and explain your actual contribution. Do not submit these prompts as a first-person account of experiences you did not have.

## Incomplete / future work

Full email-confirmation delivery and Google consent; all privileged owner/admin/staff UI workflows; live payments/inventory; verified resort policies/contact/location; shared operations persistence; AI quota/abuse controls; cross-device guest-state merges; automated provider stream interruption/Stop regression; repository-wide formatting cleanup. The rule-based travel recommendation form remains intentionally separate from the Gemini guest assistant.
