import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export function AccessDenied({ required }: { required: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-3xl font-semibold">Staff access only</h1>
      <p className="mt-2 text-muted-foreground">
        This internal page requires the <strong>{required}</strong> demo role. Guests cannot view internal resort information.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Demo role-based access — switch roles with the “Demo role” selector in the header.</p>
      <Link to="/" className="btn btn-primary mt-6">Back to Home</Link>
    </div>
  );
}
