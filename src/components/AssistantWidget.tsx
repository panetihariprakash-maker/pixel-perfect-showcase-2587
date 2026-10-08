import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/assistant.functions";
import {
  activities, demoGuest, diningVenues, facilities, formatINR, getRoom, languages, quickActionKeys, resort, rooms, t,
  type Language, type QuickKey,
} from "@/data/resort";
import { useStore } from "@/lib/store";

interface Msg { from: "bot" | "user"; text: string; note?: string; link?: { to: "/rooms" | "/concierge" | "/activities" | "/dashboard"; label: string } }

/** One shared AI Guest Assistant used on Home (floating launcher) and in My Dashboard (launcher=false, opened via openSignal). */
export function AssistantWidget({ openSignal = 0, launcher = true }: { openSignal?: number; launcher?: boolean }) {
  const { bookings } = useStore();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Language>("English");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const ai = useServerFn(askAssistant);
  const end = useRef<HTMLDivElement>(null);
  const tr = t(lang);

  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, open]);

  const answer = (key: QuickKey): Msg => {
    switch (key) {
      case "room":
        return { from: "bot", text: "Our stays:\n" + rooms.map((r) => `• ${r.name} — ${formatINR(r.price)}/night, up to ${r.capacity} guests`).join("\n"), link: { to: "/rooms", label: "Browse Rooms & Villas" } };
      case "plan":
        return { from: "bot", text: "Tell our AI Travel Concierge your dates, budget and interests and it will recommend a room, activities and dining.", link: { to: "/concierge", label: "Open AI Concierge" } };
      case "activities":
        return { from: "bot", text: "Popular experiences:\n" + activities.slice(0, 4).map((a) => `• ${a.name} (${a.duration}, ${a.difficulty})`).join("\n"), link: { to: "/activities", label: "See all activities" } };
      case "facilities":
        return { from: "bot", text: facilities.map((f) => `• ${f.name} — ${f.hours}`).join("\n") };
      case "dining":
        return { from: "bot", text: diningVenues.map((d) => `• ${d.name} (${d.cuisine}) — ${d.hours}`).join("\n") };
      case "booking": {
        const mine = bookings.filter((b) => b.guestId === demoGuest.id);
        if (!mine.length) return { from: "bot", text: "You don't have any bookings yet.", link: { to: "/rooms", label: "Browse Rooms" } };
        return { from: "bot", text: mine.map((b) => `• ${b.id}: ${getRoom(b.roomId)?.name}, ${b.checkIn} → ${b.checkOut} — ${b.status}, ${b.payment}`).join("\n"), link: { to: "/dashboard", label: "Open My Dashboard" } };
      }
      case "support":
        return { from: "bot", text: `Guest support is available 24/7.\nPhone: ${resort.phone}\nEmail: ${resort.email}\nCheck-in ${resort.checkInTime}, check-out ${resort.checkOutTime}. You can also use the “How Can We Help You?” form below.` };
    }
  };

  const mine = bookings.filter((b) => b.guestId === demoGuest.id);

  const keyFor = (l: string): QuickKey | null =>
    /room|villa|suite|stay|price|treehouse/.test(l) ? "room"
    : /plan|recommend|itinerar/.test(l) ? "plan"
    : /trek|hike|activit|yoga|zip|tour/.test(l) ? "activities"
    : /pool|spa|gym|facilit|wifi|transfer/.test(l) ? "facilities"
    : /food|dining|restaurant|eat|breakfast|dinner/.test(l) ? "dining"
    : /booking|reservation|my stay|payment/.test(l) ? "booking"
    : /help|support|contact|phone|check/.test(l) ? "support"
    : null;

  const run = async (question: string, key: QuickKey | null) => {
    if (busy) return;
    const history = [...msgs, { from: "user" as const, text: question }];
    setMsgs(history);
    setBusy(true);
    const link = key ? answer(key).link : undefined;
    try {
      const res = await ai({ data: {
        language: lang,
        messages: history.slice(-12).map((m) => ({ role: m.from === "user" ? "user" as const : "assistant" as const, content: m.text })),
        myBookings: mine.map((b) => ({ id: b.id, room: getRoom(b.roomId)?.name ?? b.roomId, checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, nights: b.nights, total: b.total, status: b.status, payment: b.payment })),
      } });
      if (res.ok) setMsgs((m) => [...m, { from: "bot", text: res.text, link }]);
      else throw new Error(res.error);
    } catch (e) {
      const fb = key ? answer(key) : { from: "bot" as const, text: "I can help with rooms, stay planning, activities, facilities, dining, your booking or guest support." };
      setMsgs((m) => [...m, { ...fb, note: `${e instanceof Error && e.message ? e.message : "The AI assistant is unavailable right now."} Showing standard resort information instead.` }]);
    } finally {
      setBusy(false);
    }
  };

  const ask = (key: QuickKey) => run(tr.actions[key], key);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    run(q, keyFor(q.toLowerCase()));
  };

  return (
    <>
      {launcher && !open && (
        <button onClick={() => setOpen(true)} className="btn btn-primary fixed bottom-5 right-5 z-40 !px-5 !py-3.5 shadow-card" aria-label="Open AI Guest Assistant">
          <MessageCircle className="h-5 w-5" /> <span className="hidden sm:inline">Ask AI Assistant</span>
        </button>
      )}
      {open && (
        <div role="dialog" aria-label="AI Guest Assistant" className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-card sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]">
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex min-w-0 items-center gap-2"><Sparkles className="h-4 w-4 shrink-0" /><span className="truncate font-semibold">{tr.title}</span></div>
            <div className="flex shrink-0 items-center gap-2">
              <select aria-label="Assistant language" value={lang} onChange={(e) => setLang(e.target.value as Language)} className="rounded-md bg-primary-foreground/15 px-2 py-1 text-xs text-primary-foreground">
                {languages.map((l) => <option key={l} value={l} className="text-foreground">{l}</option>)}
              </select>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-1 hover:bg-primary-foreground/15"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5">{tr.greeting}</div>
            <div className="flex flex-wrap gap-1.5">
              {quickActionKeys.map((k) => (
                <button key={k} disabled={busy} onClick={() => ask(k)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">{tr.actions[k]}</button>
              ))}
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-foreground" : "max-w-[90%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5"}>
                <p className="whitespace-pre-line">{m.text}</p>
                {m.note && <p className="mt-2 text-[11px] text-muted-foreground">{m.note}</p>}
                {m.link && <Link to={m.link.to} className="mt-2 inline-block text-xs font-semibold text-primary underline">{m.link.label} →</Link>}
              </div>
            ))}
            {busy && <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input aria-label={tr.placeholder} value={input} onChange={(e) => setInput(e.target.value)} placeholder={tr.placeholder} className="field" />
            <button type="submit" disabled={busy} className="btn btn-primary !px-3" aria-label={tr.send}><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
