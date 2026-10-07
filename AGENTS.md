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
- All resort data lives in src/data/resort.ts and mutable demo state in src/lib/store.tsx (localStorage); screens must read from these, never duplicate data — Week 1 has no backend.
- Staff pages gate on the demo role in the store and staff links only render for staff roles — demo-only access control until real auth exists.
