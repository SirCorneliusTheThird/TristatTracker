import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TriStat Tracker — Steam & Epic stats in one place" },
      {
        name: "description",
        content:
          "Track playtime, achievements, friends and goals across Steam and Epic Games with a single privacy-first dashboard.",
      },
      { property: "og:title", content: "TriStat Tracker — Steam & Epic stats in one place" },
      {
        property: "og:description",
        content: "Track playtime, achievements, friends and goals across Steam and Epic Games with a single privacy-first dashboard.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BarChart3, title: "Combined dashboard", body: "Total playtime, games tracked and top titles across Steam and Epic." },
  { icon: Activity, title: "Friends & activity", body: "Auto-imported friends with live presence and a shared activity feed." },
  { icon: Target, title: "Goals that update themselves", body: "Playtime, achievement and per-game goals fed by your synced stats." },
  { icon: Shield, title: "Privacy & Kids Mode", body: "Visibility controls, hidden stats, PIN-locked parental controls." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">T</div>
          <span className="font-semibold">TriStat Tracker</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20">
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">Steam + Epic</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-bold sm:text-6xl">
          Every hour, achievement and friend — one tracker.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Link your Steam and Epic accounts once. TriStat syncs your library, playtime, achievements, online status
          and friends, then keeps your goals moving automatically.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">I already have an account</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="surface p-5">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
