import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import {
  activities, demoGuest, diningVenues, facilities, formatINR, getRoom, languages, quickActionKeys, resort, rooms, t,
  type Language, type QuickKey,
} from "@/data/resort";
import { useStore } from "@/lib/store";

interface Msg { from: "bot" | "user"; text: string; link?: { to: "/rooms" | "/concierge" | "/activities" | "/dashboard"; label: string } }

export function AssistantWidget() {
  const { bookings } = useStore();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Language>("English");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const tr = t(lang);

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

  const ask = (key: QuickKey) => setMsgs((m) => [...m, { from: "user", text: tr.actions[key] }, answer(key)]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const l = q.toLowerCase();
    const key: QuickKey | null =
      /room|villa|suite|stay|price|treehouse/.test(l) ? "room"
      : /plan|recommend|itinerar/.test(l) ? "plan"
      : /trek|hike|activit|yoga|zip|tour/.test(l) ? "activities"
      : /pool|spa|gym|facilit|wifi|transfer/.test(l) ? "facilities"
      : /food|dining|restaurant|eat|breakfast|dinner/.test(l) ? "dining"
      : /booking|reservation|my stay/.test(l) ? "booking"
      : /help|support|contact|phone|check/.test(l) ? "support"
      : null;
    setMsgs((m) => [...m, { from: "user", text: q }, key ? answer(key) : { from: "bot", text: "I can help with rooms, stay planning, activities, facilities, dining, your booking or guest support. Try one of the quick actions." }]);
    setInput("");
  };

  return (
    <>
      {!open && (
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
                <button key={k} onClick={() => ask(k)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">{tr.actions[k]}</button>
              ))}
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-foreground" : "max-w-[90%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5"}>
                <p className="whitespace-pre-line">{m.text}</p>
                {m.link && <Link to={m.link.to} className="mt-2 inline-block text-xs font-semibold text-primary underline">{m.link.label} →</Link>}
              </div>
            ))}
            {lang !== "English" && msgs.length > 0 && <p className="text-[11px] text-muted-foreground">Detailed answers are shown in English (translation unavailable).</p>}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input aria-label={tr.placeholder} value={input} onChange={(e) => setInput(e.target.value)} placeholder={tr.placeholder} className="field" />
            <button type="submit" className="btn btn-primary !px-3" aria-label={tr.send}><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
