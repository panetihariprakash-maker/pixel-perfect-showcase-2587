import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { isoDay, languages, nightsBetween, resort } from "@/data/resort";
import { Field } from "@/components/ui-kit";
import { EMAIL_RE, PHONE_RE, useStore } from "@/lib/store";

const topics = ["Room Booking", "Existing Reservation", "Activities", "Dining", "Resort Facilities", "Other"];

export function EnquirySection() {
  const { addEnquiry } = useStore();
  const empty = { name: "", email: "", phone: "", checkIn: "", checkOut: "", guests: "2", topic: "", language: "English", message: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Full name is required.";
    if (!EMAIL_RE.test(f.email.trim())) er.email = "Enter a valid email address.";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) er.phone = "Enter a valid 10-digit mobile number.";
    if (!f.checkIn) er.checkIn = "Choose a check-in date.";
    else if (f.checkIn < isoDay(0)) er.checkIn = "Check-in cannot be in the past.";
    if (!f.checkOut) er.checkOut = "Choose a check-out date.";
    else if (f.checkIn && nightsBetween(f.checkIn, f.checkOut) <= 0) er.checkOut = "Check-out must be after check-in.";
    const g = Number(f.guests);
    if (!Number.isInteger(g) || g < 1 || g > 20) er.guests = "Enter between 1 and 20 guests.";
    if (!f.topic) er.topic = "Please choose a topic.";
    if (f.message.trim().length < 5) er.message = "Please tell us a little about your request.";
    setErrors(er);
    if (Object.keys(er).length) return;
    addEnquiry({ id: "EQ-" + Date.now(), name: f.name, topic: f.topic, createdAt: isoDay(0) });
    setDone(true);
    setF(empty);
  };

  return (
    <section id="help" className="px-4 py-16 sm:px-6 lg:px-12 xl:px-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">Guest enquiry</p>
          <h2 className="mt-2 text-4xl font-semibold sm:text-5xl">How Can We Help You?</h2>
          <p className="mt-4 text-muted-foreground">Tell us about your plans or request and our guest team will understand exactly what you need.</p>
          <p className="mt-4 flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" /> Available in {languages.length} languages</p>
        </div>
        <form onSubmit={submit} noValidate className="rounded-2xl bg-card p-6 shadow-card sm:p-8">
          {done && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-success/10 p-4 text-sm text-success" role="status">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> Thank you. Your enquiry has been recorded for demo purposes.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" htmlFor="e-name" error={errors.name}><input id="e-name" className="field" value={f.name} onChange={set("name")} aria-invalid={!!errors.name} /></Field>
            <Field label="Email Address" htmlFor="e-email" error={errors.email}><input id="e-email" type="email" className="field" value={f.email} onChange={set("email")} aria-invalid={!!errors.email} /></Field>
            <Field label="Mobile Number" htmlFor="e-phone" error={errors.phone}><input id="e-phone" type="tel" className="field" value={f.phone} onChange={set("phone")} aria-invalid={!!errors.phone} /></Field>
            <Field label="Number of Guests" htmlFor="e-guests" error={errors.guests}><input id="e-guests" type="number" min={1} className="field" value={f.guests} onChange={set("guests")} aria-invalid={!!errors.guests} /></Field>
            <Field label="Check-in Date" htmlFor="e-in" error={errors.checkIn}><input id="e-in" type="date" className="field" value={f.checkIn} onChange={set("checkIn")} aria-invalid={!!errors.checkIn} /></Field>
            <Field label="Check-out Date" htmlFor="e-out" error={errors.checkOut}><input id="e-out" type="date" className="field" value={f.checkOut} onChange={set("checkOut")} aria-invalid={!!errors.checkOut} /></Field>
            <Field label="What do you need help with?" htmlFor="e-topic" error={errors.topic}>
              <select id="e-topic" className="field" value={f.topic} onChange={set("topic")} aria-invalid={!!errors.topic}>
                <option value="">Select a topic</option>
                {topics.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Preferred Language" htmlFor="e-lang">
              <select id="e-lang" className="field" value={f.language} onChange={set("language")}>{languages.map((l) => <option key={l}>{l}</option>)}</select>
            </Field>
          </div>
          <div className="mt-4"><Field label="Message / Special Requests" htmlFor="e-msg" error={errors.message}><textarea id="e-msg" rows={4} className="field" value={f.message} onChange={set("message")} aria-invalid={!!errors.message} /></Field></div>
          <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto">Submit enquiry</button>
          <p className="mt-3 text-xs text-muted-foreground">Demo only — no email is sent.</p>
        </form>
      </div>
    </section>
  );
}
