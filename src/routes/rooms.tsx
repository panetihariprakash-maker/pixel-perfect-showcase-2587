import { createFileRoute } from "@tanstack/react-router";
import { RoomsSection } from "@/components/guest/RoomsSection";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms & Villas — The Azure Ridge Sanctuary" },
      { name: "description", content: "Explore every room, suite, treehouse and villa at The Azure Ridge Sanctuary, with prices in INR." },
      { property: "og:title", content: "Rooms & Villas — The Azure Ridge Sanctuary" },
      { property: "og:description", content: "Explore every room, suite, treehouse and villa at The Azure Ridge Sanctuary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  return (
    <div>
      <section className="px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Stay</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Rooms & Villas</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Every accommodation at the Sanctuary. Booking requests need a guest account; payments stay in test mode.</p>
        </div>
      </section>
      <RoomsSection />
    </div>
  );
}
