import { useMemo, useState } from "react";
import { Check, Users } from "lucide-react";
import { formatINR, rooms, type Room } from "@/data/resort";
import { EmptyState, Modal } from "@/components/ui-kit";
import { BookingDialog } from "@/components/BookingDialog";


const budgets = [
  { label: "Any budget", max: Infinity },
  { label: "Up to ₹10,000", max: 10000 },
  { label: "Up to ₹15,000", max: 15000 },
  { label: "Up to ₹25,000", max: 25000 },
];

export function RoomsSection() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const [guests, setGuests] = useState("any");
  const [budget, setBudget] = useState(0);
  const [type, setType] = useState("All");
  const [detail, setDetail] = useState<Room | null>(null);
  const [book, setBook] = useState<Room | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rooms.filter((r) => (!q || r.name.toLowerCase().includes(q)) && (guests === "any" || r.capacity >= Number(guests)) && r.price <= budgets[budget].max && (type === "All" || r.type === type));
    if (sort === "price-asc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [query, sort, guests, budget, type]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-3 rounded-2xl bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-sm font-medium lg:col-span-2">Search
            <input className="field mt-1" type="search" placeholder="Room or villa name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="text-sm font-medium">Number of Guests
            <select className="field mt-1" value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option value="any">Any</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Budget
            <select className="field mt-1" value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
              {budgets.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Room Type
            <select className="field mt-1" value={type} onChange={(e) => setType(e.target.value)}>
              {["All", "Room", "Suite", "Villa", "Cottage"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Sort
            <select className="field mt-1" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="default">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-6"><button className="btn btn-outline w-full sm:w-auto" onClick={() => { setQuery(""); setSort("default"); setGuests("any"); setBudget(0); setType("All"); }}>Reset filters</button></div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{list.length} stay{list.length !== 1 && "s"} found</p>
        {list.length === 0 ? (
          <EmptyState title="No rooms match these filters"><p className="text-sm text-muted-foreground">Try a higher budget or fewer guests.</p></EmptyState>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {list.map((r) => (
              <article key={r.id} className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card">
                <img src={r.image} alt={r.name} loading="lazy" width={1024} height={768} className="aspect-[16/10] w-full object-cover" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0"><p className="text-xs uppercase tracking-wider text-muted-foreground">{r.type} · {r.size}</p><h2 className="text-3xl font-semibold">{r.name}</h2></div>
                    <div className="shrink-0 text-right"><p className="text-lg font-bold text-primary">{formatINR(r.price)}</p><p className="text-xs text-muted-foreground">per night</p></div>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm"><Users className="h-4 w-4" /> Up to {r.capacity} guests</p>
                  <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">{r.facilities.map((x) => <li key={x} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{x}</li>)}</ul>
                  <div className="mt-auto flex gap-2 pt-5">
                    <button className="btn btn-outline flex-1" onClick={() => setDetail(r)}>View Details</button>
                    <button className="btn btn-primary flex-1" onClick={() => setBook(r)}>Book Now</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""} wide>
        {detail && (
          <div>
            <img src={detail.image} alt={detail.name} width={1024} height={768} className="aspect-[16/9] w-full rounded-xl object-cover" />
            <p className="mt-4 text-muted-foreground">{detail.details}</p>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <p><strong>Price:</strong> {formatINR(detail.price)}/night</p><p><strong>Capacity:</strong> {detail.capacity} guests</p><p><strong>Size:</strong> {detail.size}</p>
            </div>
            <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">{detail.facilities.map((x) => <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{x}</li>)}</ul>
            <button className="btn btn-primary mt-6 w-full" onClick={() => { setBook(detail); setDetail(null); }}>Book Now</button>
          </div>
        )}
      </Modal>
      {book && <BookingDialog room={book} onClose={() => setBook(null)} />}
    </div>
  );
}
