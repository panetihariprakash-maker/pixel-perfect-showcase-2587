import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Search, ShieldCheck, Headphones, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/ui-kit';
import { Button } from '@/components/ui/button';
import { policySections, guestFaqs } from '@/data/guest-information';
import { pageMeta } from '@/lib/metadata';
export const Route = createFileRoute('/policies')({ head: () => pageMeta('Policies, FAQs & Guest Information', 'Reservation, payment and guest information, with unconfirmed resort policies clearly marked.'), component: Policies });
function Policies() {
  const [search, setSearch] = useState('');
  const faqs = guestFaqs.filter(f => `${f.question} ${f.answer}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div><PageHeader eyebrow="Before your stay" title="Policies, FAQs & Guest Information" description="A little clarity for a more peaceful escape." /><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-8 flex items-start gap-3 border-l-4 border-accent bg-secondary/60 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p className="text-sm">Official policies have not yet been confirmed by the resort. The information below distinguishes the current demonstration from details requiring confirmation.</p></div>
    <div className="grid gap-5 md:grid-cols-2">{policySections.map((p,i) => <article key={p.title} className="rounded-lg border bg-card p-6"><span className="text-xs font-semibold text-accent">0{i+1}</span><h2 className="mt-2 text-2xl font-semibold">{p.title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{p.text}</p><p className="mt-4 text-xs font-semibold text-primary">Resort confirmation required</p></article>)}</div>
    <section className="mt-14"><p className="eyebrow">Your questions, answered</p><h2 className="mt-2 text-4xl font-semibold">Frequently Asked Questions</h2><div className="relative mt-6 max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input aria-label="Search FAQs" className="field pl-10" placeholder="Search bookings, payments, check-in…" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="mt-6 divide-y border-y">{faqs.map(f => <details key={f.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{f.question}<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{f.answer}</p></details>)}{!faqs.length && <p role="status" className="py-8 text-muted-foreground">No matching answers. Our guest support form is available below.</p>}</div></section>
    <div className="mt-10 flex flex-col justify-between gap-4 border-t pt-8 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 text-2xl font-semibold"><Headphones className="h-5 w-5 text-primary" />Still have a question?</h2><p className="mt-2 text-sm text-muted-foreground">Send a guest enquiry about your stay.</p></div><Button asChild className="rounded-full"><Link to="/dashboard" hash="help">Contact Guest Support</Link></Button></div>
    <div className="mt-8 flex flex-wrap gap-5 text-sm text-primary"><Link to="/">Home</Link><Link to="/dashboard">My Dashboard</Link><Link to="/how-to-reach">How to Reach Us →</Link></div>
  </div></div>;
}