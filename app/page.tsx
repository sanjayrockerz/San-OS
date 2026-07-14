import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Command, Layers3, Sparkles, Zap } from "lucide-react";

const features = [
  { icon: Zap, title: "One clear next move", body: "Turn a busy day into a focused plan you can actually finish." },
  { icon: Layers3, title: "Everything in context", body: "Projects, learning, finances and ideas stay connected." },
  { icon: Sparkles, title: "Built around your momentum", body: "See what matters now, what is slipping, and where to go next." },
];

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#08090d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_65%_8%,rgba(124,125,255,0.22),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(34,211,238,0.10),transparent_28%)]" />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="San OS home">
          <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-lg shadow-indigo-500/20">
            <Image src="/logo.png" alt="" width={36} height={36} className="size-full object-cover" />
          </span>
          <span className="font-semibold tracking-tight">San OS</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white">Sign in</Link>
          <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#101118] transition hover:bg-indigo-100">Open workspace <ArrowRight className="ml-1 inline size-4" /></Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-32 lg:pt-24">
        <div className="max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs font-medium text-indigo-100"><span className="size-1.5 rounded-full bg-emerald-300" /> Your personal operating system</div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Make your whole life easier to run.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-white/55">San OS brings your goals, work, learning and daily execution into one calm command center.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/login" className="rounded-full bg-[#8586ff] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:bg-[#999aff]">Enter San OS <ArrowRight className="ml-1 inline size-4" /></Link>
            <span className="flex items-center gap-2 text-sm text-white/40"><Check className="size-4 text-emerald-300" /> Private by default</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
          <div className="absolute -inset-8 rounded-[3rem] bg-indigo-500/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#12141b]/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex gap-1.5"><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/20" /></div><div className="flex items-center gap-2 text-[10px] text-white/40"><Command className="size-3" /> command center</div></div>
            <div className="grid gap-3 p-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/30 via-[#1b1d2b] to-[#15161d] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200/75">Tuesday · 10:30</p><h2 className="mt-12 text-2xl font-semibold tracking-tight">Finish what matters.</h2><p className="mt-2 text-xs leading-5 text-white/45">Your best next move is ready when you are.</p><div className="mt-6 flex items-center gap-2 text-xs text-white/70"><span className="size-2 rounded-full bg-emerald-300" /> Complete authentication flow <span className="ml-auto text-white/35">90m</span></div></div>
              <div className="space-y-3"><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Focus today</p><p className="mt-3 text-3xl font-semibold">120<span className="text-sm text-white/35"> min</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-indigo-400" /></div></div><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Momentum</p><p className="mt-2 text-sm text-white/75">12 day streak <span className="text-emerald-300">↗ 8%</span></p><div className="mt-3 flex items-end gap-1">{[22, 34, 28, 42, 38, 53, 68].map((h, i) => <span key={i} className="flex-1 rounded-t bg-indigo-400/60" style={{ height: `${h}px` }} />)}</div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-4 border-t border-white/10 px-6 py-12 sm:grid-cols-3 lg:px-10">
        {features.map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><Icon className="size-5 text-indigo-300" /><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{body}</p></div>)}
      </section>
      <footer className="relative mx-auto flex max-w-7xl items-center justify-between px-6 pb-8 text-xs text-white/30 lg:px-10"><span>San OS · Personal Engine</span><span>Designed for a calmer, more capable day.</span></footer>
    </main>
  );
}
