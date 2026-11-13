<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Keep resort catalogue data centralized in src/data/resort.ts; guest sections reuse src/components/guest inside the protected dashboard, and legacy feature URLs redirect there.
- Guest accounts use Cloud Auth and owner-scoped profiles/guest_bookings with RLS; never hydrate real guest bookings from the shared demo store, to prevent cross-account disclosure.
- Guest plans and enquiries persist in owner-scoped guest_state; database validation permits only pending test-payment requests and cancellation, preventing forged payment success.
- Staff roles come only from the protected user_roles table; query parameters and browser storage must never grant staff access.
- Operational sample data stays in the local demo store, separate from private guest reservations, until resort operations are connected.
- Dashboard navigation selects guest sections through URL hashes in a shared collapsible sidebar; informational pages remain public and separately shareable.
- Root owns the single auth-state subscriber and supplies session state to guest UI; protected routes validate through the authenticated layout.
- Business owner portal (/owner) and Super Admin (/admin) live under _authenticated; owner data access depends on RLS via is_approved_owner(), and status changes are enforced by DB triggers so only superadmins can approve, reject or suspend.
- Listing photos are stored in the private listing-photos bucket under `<owner uid>/` and shown through signed URLs.
- Owner listing permissions (can_add/edit/publish/remove) live on business_owners and are enforced by RLS via owner_can() and the listing trigger; the UI only mirrors them.
- Privileged admin actions needing auth.users (invites, user list, role changes) go through src/lib/admin.functions.ts, which verifies the superadmin role before loading the service client.
- The public catalogue reads partner listings only through the public_listings() SQL function, which returns approved listings from approved owners with safe columns; photo access follows is_public_photo().
- Audit history is written by database triggers into admin_audit_log, so every change is captured regardless of which client made it.
- public."user" is a trigger-maintained account summary (synced from profiles, auth email, user_roles); its role column is display-only and never used for authorization.
- The public assistant streams Gemini using server-only credentials, central demo facts and a schema-filtered anonymous public_listings() read; never pass private guest records or owner identifiers into public conversations.
- Guest state writes are serialized and update UI only after successful persistence; loaded-state and identity guards prevent stale account writes and false success messages.
- The floating assistant uses AI Elements for its transcript and composer while retaining the existing resort shell; conversation history lives only in component memory and clears on identity changes.
- Validate guest requests and owner reservations with database triggers; demo room constants in the guest trigger must match the central catalogue so forged totals and capacities are rejected.
- Owner stay totals sum individual nights using the same seasonal/discount calculation in UI and database; checkout is excluded so boundary stays are priced correctly.
- Property reassignment is blocked until a transaction can transfer dependent reservations and media safely; draft photo removal only changes metadata so Cancel preserves stored photos.
- Partner guest requests reuse owner_reservations through authenticated, narrowly scoped database functions; guests never read owner notes or identifiers, and database pricing remains authoritative.
- Public inventory exposes aggregate unit counts only; guest dashboard counts are private requests plus approved catalogue inventory, never sample operational statistics.
- Recoverable assistant outages use explicit NDJSON error events before or during streaming; HTTP validation/auth failures remain non-success responses so outages do not trigger page-level crash handling.
