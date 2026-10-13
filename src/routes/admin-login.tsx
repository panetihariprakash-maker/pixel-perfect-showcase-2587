import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { pageMeta } from "@/lib/metadata";

export const Route = createFileRoute("/admin-login")({
  head: () => {
    const m = pageMeta("Super Admin Sign In", "Restricted sign-in for platform administrators.");
    return { ...m, meta: [...(m.meta ?? []), { name: "robots", content: "noindex" }] };
  },
  component: () => <AuthForm portal="admin" />,
});
