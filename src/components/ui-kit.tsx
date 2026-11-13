import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeTone: Record<string, string> = {
  Confirmed: "bg-success/15 text-success",
  Paid: "bg-success/15 text-success",
  Ready: "bg-success/15 text-success",
  Done: "bg-success/15 text-success",
  "Checked In": "bg-info/15 text-info",
  "Checked Out": "bg-muted text-muted-foreground",
  Pending: "bg-warning/20 text-accent-foreground",
  "Payment Pending": "bg-warning/20 text-accent-foreground",
  "In Progress": "bg-info/15 text-info",
  Cleaning: "bg-info/15 text-info",
  Inspection: "bg-warning/20 text-accent-foreground",
  Open: "bg-warning/20 text-accent-foreground",
  "Payment Ready/Test": "bg-primary/10 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
  Draft: "bg-muted text-muted-foreground",
  "Pending Approval": "bg-warning/20 text-accent-foreground",
  Approved: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Suspended: "bg-ink text-ink-foreground",
  Requested: "bg-warning/20 text-accent-foreground",
  Declined: "bg-destructive/15 text-destructive",
  Completed: "bg-muted text-muted-foreground",
  "Out of Service": "bg-destructive/15 text-destructive",
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/20 text-accent-foreground",
  Low: "bg-muted text-muted-foreground",
  Easy: "bg-success/15 text-success",
  Moderate: "bg-warning/20 text-accent-foreground",
  Challenging: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badgeTone[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 shadow-card sm:rounded-2xl sm:p-7", wide ? "sm:max-w-3xl" : "sm:max-w-xl")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="border-b bg-secondary/10">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <p className="font-display text-2xl font-semibold">{title}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
