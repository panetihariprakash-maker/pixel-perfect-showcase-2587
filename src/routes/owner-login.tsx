import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { pageMeta } from "@/lib/metadata";

export const Route = createFileRoute("/owner-login")({
  head: () => pageMeta("Business Owner Sign In", "Sign in to manage your properties, rooms and reservations on The Azure Ridge Sanctuary."),
  component: () => <AuthForm portal="owner" />,
});
