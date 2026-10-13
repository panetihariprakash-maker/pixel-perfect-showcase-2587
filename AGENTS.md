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
