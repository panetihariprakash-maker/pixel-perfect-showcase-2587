import { createFileRoute, redirect } from "@tanstack/react-router";

// Guest features now live inside My Dashboard; keep the old URL working.
export const Route = createFileRoute("/activities")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", hash: "activities" });
  },
});
