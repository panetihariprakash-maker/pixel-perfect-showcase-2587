import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Modal, Field, StatusBadge } from "@/components/ui-kit";
import { demoGuest, formatINR, isoDay, nightsBetween, type Booking, type Room } from "@/data/resort";
import { useAuth } from "@/lib/auth";
import { useStore, EMAIL_RE, PHONE_RE } from "@/lib/store";

type Step = 1 | 2 | 3 | 4 | 5;
const stepNames = ["Dates & guests", "Guest details", "Summary", "Payment", "Confirmation"];

export function BookingDialog({ room, onClose, initial }: { room: Room | null; onClose: () => void; initial?: { checkIn?: string; checkOut?: string; guests?: number } }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { addBooking } = useStore();
  const [step, setStep] = useState<Step>(1);
  const [f, setF] = useState({
    checkIn: initial?.checkIn ?? isoDay(7),
    checkOut: initial?.checkOut ?? isoDay(9),
    guests: String(initial?.guests ?? Math.min(2, room?.capacity ?? 2)),
    name: user?.user_metadata?.full_name ?? "", email: user?.email ?? "", phone: user?.user_metadata?.mobile ?? "", requests: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Booking | null>(null);

  if (!room) return null;
  const nights = nightsBetween(f.checkIn, f.checkOut);
  const total = nights > 0 ? nights * room.price : 0;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!f.checkIn) e.checkIn = "Please choose a check-in date.";
    else if (f.checkIn < isoDay(0)) e.checkIn = "Check-in cannot be in the past.";
    if (!f.checkOut) e.checkOut = "Please choose a check-out date.";
    else if (f.checkIn && nights <= 0) e.checkOut = "Check-out must be after check-in.";
    const g = Number(f.guests);
    if (!Number.isInteger(g) || g < 1) e.guests = "Enter at least 1 guest.";
    else if (g > room.capacity) e.guests = `This ${room.type.toLowerCase()} fits up to ${room.capacity} guests.`;
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validate2 = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Full name is required.";
    if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit phone number.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const confirm = async () => {
    if (!user) { setSaveError("Please sign in before saving a booking."); return; }
    setSaving(true); setSaveError("");
    const b: Booking = {
      id: "AR-" + crypto.randomUUID(),
      guestId: user.id,
      guestName: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(),
      roomId: room.id, checkIn: f.checkIn, checkOut: f.checkOut, guests: Number(f.guests),
      nights, total, status: "Pending", payment: "Payment Ready/Test", createdAt: isoDay(0),
      requests: f.requests.trim() || undefined,
    };
    try { await addBooking(b); setCreated(b); setStep(5); }
    catch (error) { setSaveError(error instanceof Error ? error.message : "Unable to save booking."); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={step === 5 ? "Booking recorded" : `Book ${room.name}`}>
      {saveError && <p role="alert" className="mb-4 text-sm text-destructive">{saveError}</p>}
      <ol className="mb-6 flex gap-1" aria-label="Booking steps">
        {stepNames.map((n, i) => (
          <li key={n} className="flex-1">
            <div className={`h-1 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
            <span className={`mt-1 hidden text-[11px] sm:block ${i + 1 === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check-in" htmlFor="b-in" error={errors.checkIn}><input id="b-in" type="date" className="field" value={f.checkIn} min={isoDay(0)} onChange={set("checkIn")} aria-invalid={!!errors.checkIn} /></Field>
            <Field label="Check-out" htmlFor="b-out" error={errors.checkOut}><input id="b-out" type="date" className="field" value={f.checkOut} min={f.checkIn} onChange={set("checkOut")} aria-invalid={!!errors.checkOut} /></Field>
          </div>
          <Field label={`Number of guests (max ${room.capacity})`} htmlFor="b-g" error={errors.guests}><input id="b-g" type="number" min={1} max={room.capacity} className="field" value={f.guests} onChange={set("guests")} aria-invalid={!!errors.guests} /></Field>
          <div className="flex justify-end"><button className="btn btn-primary" onClick={() => validate1() && setStep(2)}>Continue</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="Full name" htmlFor="b-name" error={errors.name}><input id="b-name" className="field" value={f.name} onChange={set("name")} aria-invalid={!!errors.name} autoComplete="name" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="b-email" error={errors.email}><input id="b-email" type="email" className="field" value={f.email} onChange={set("email")} aria-invalid={!!errors.email} autoComplete="email" /></Field>
            <Field label="Phone" htmlFor="b-phone" error={errors.phone}><input id="b-phone" type="tel" className="field" value={f.phone} onChange={set("phone")} aria-invalid={!!errors.phone} placeholder="98765 43210" autoComplete="tel" /></Field>
          </div>
          <Field label="Special requests (optional)" htmlFor="b-req"><textarea id="b-req" rows={3} className="field" value={f.requests} onChange={set("requests")} /></Field>
          <div className="flex justify-between"><button className="btn btn-outline" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary" onClick={() => validate2() && setStep(3)}>Review booking</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <dl className="divide-y rounded-xl border text-sm">
            {[
              ["Room / Villa", room.name],
              ["Check-in", f.checkIn],
              ["Check-out", f.checkOut],
              ["Number of guests", f.guests],
              ["Guest", `${f.name} · ${f.email} · ${f.phone}`],
              ["Price per night", formatINR(room.price)],
              ["Number of nights", String(nights)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
            <div className="flex justify-between bg-secondary/60 px-4 py-3"><dt className="font-semibold">Total amount</dt><dd className="text-lg font-bold">{formatINR(total)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">{formatINR(room.price)} × {nights} night{nights > 1 ? "s" : ""} = {formatINR(total)} (taxes excluded in demo)</p>
          <div className="flex justify-between"><button className="btn btn-outline" onClick={() => setStep(2)}>Back</button><button className="btn btn-primary" onClick={() => setStep(4)}>Continue to payment</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-secondary/50 p-5">
            <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" /> Payment Test / Payment Ready</div>
            <p className="mt-2 text-sm text-muted-foreground">
              A live payment gateway is not connected in this Week 1 prototype, so no money will be charged and no payment will be marked as successful.
              Your booking will be saved with payment status <strong>“Payment Ready/Test”</strong>.
            </p>
            <p className="mt-3 text-sm">Amount due: <strong>{formatINR(total)}</strong></p>
          </div>
          <div className="flex justify-between"><button className="btn btn-outline" onClick={() => setStep(3)}>Back</button><button className="btn btn-accent" onClick={confirm} disabled={saving}>{saving ? "Saving…" : "Save booking (test mode)"}</button></div>
        </div>
      )}

      {step === 5 && created && (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="text-lg font-semibold">Reference {created.id}</p>
          <div className="flex justify-center gap-2"><StatusBadge status={created.status} /><StatusBadge status={created.payment} /></div>
          <p className="text-sm text-muted-foreground">Your booking request is saved for demo purposes. Payment has not been taken — it is in test/ready state.</p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/dashboard" className="btn btn-primary" onClick={onClose}>View in Dashboard</Link>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
