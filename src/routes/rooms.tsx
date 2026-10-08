import { createFileRoute, redirect } from "@tanstack/react-router";

// Guest features now live inside My Dashboard; keep the old URL working.
export const Route = createFileRoute("/rooms")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", hash: "rooms" });
  },
});
