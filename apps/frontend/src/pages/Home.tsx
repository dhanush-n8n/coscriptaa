import { motion } from "framer-motion";
import { ArrowRight, Braces, Check, CirclePlay, Code2, FolderPlus, LayoutDashboard, Link2, MessagesSquare, MousePointer2, ShieldCheck, Sparkles, UsersRound, Workflow, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: UsersRound, title: "A room that feels shared", description: "See who is active and collaborate in the same workspace—without losing the thread." },
  { icon: MessagesSquare, title: "The conversation stays close", description: "Discuss ideas beside the code, share context, and make faster decisions together." },
  { icon: Braces, title: "Everything in its place", description: "Code, run, sketch, and review with an interface built for uninterrupted flow." },
];

const steps = [
  { icon: FolderPlus, number: "01", title: "Create a room", description: "Open a focused workspace in a few seconds. No complex setup required." },
  { icon: Link2, number: "02", title: "Share your link", description: "Invite collaborators with a room code or a shareable link whenever you’re ready." },
  { icon: Workflow, number: "03", title: "Build in sync", description: "Write, talk, draw, and run code together from one polished workspace." },
];

export const Home = () => (
  <main className="relative min-h-screen overflow-hidden bg-[#F1F5F9] text-slate-800">
    <div className="pointer-events-none absolute left-[8%] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-cyan-400/20 blur-[145px]" />
    <div className="pointer-events-none absolute right-[-12rem] top-[8rem] h-[32rem] w-[32rem] rounded-full bg-blue-500/15 blur-[135px]" />

    <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
      <nav className="flex h-24 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-lg font-extrabold tracking-tight text-slate-900">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-blue-500/30 text-white"><Code2 size={21} /></span>
          CoScripta
        </Link>
        <div className="hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex">
          <a href="#how-it-works" className="transition hover:text-slate-900">How it works</a>
          <a href="#features" className="transition hover:text-slate-900">Features</a>
          <Link to="/dashboard" className="text-[#3b49df] hover:text-blue-700 transition flex items-center gap-1.5 font-bold">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#3b49df] transition hover:bg-blue-100 sm:hidden">
            Dashboard
          </Link>
          <Link to="/start" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-[#3b49df] hover:text-[#3b49df]">Enter a room</Link>
        </div>
      </nav>

      <section className="grid items-center gap-16 py-16 lg:grid-cols-[1fr_.92fr] lg:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-wide text-[#3b49df]"><Sparkles size={14} /> THE COLLABORATIVE CODING SPACE</div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-.055em] text-slate-900 sm:text-6xl lg:text-7xl">Real-time coding, <span className="bg-gradient-to-r from-[#3b49df] via-blue-500 to-cyan-500 bg-clip-text text-transparent">perfectly synced.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">CoScripta brings your editor, conversations, whiteboard, and execution environment into one calm space—so your team can stay in flow.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/start" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-[#3b49df] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/40">Create a workspace <ArrowRight size={17} className="transition group-hover:translate-x-1" /></Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"><CirclePlay size={17} className="text-[#3b49df]" /> See how it works</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
            {["Instant rooms", "Live presence", "No setup required"].map(item => <span key={item} className="flex items-center gap-2"><Check size={16} className="text-cyan-500" />{item}</span>)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .65, delay: .12 }} className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-[#3b49df]/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div><span className="font-mono-app text-[11px] font-semibold text-slate-500">workspace / checkout.ts</span><span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-200">LIVE</span></div>
            <div className="grid min-h-[330px] grid-cols-[1fr_155px] gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 font-mono-app text-xs leading-7 text-slate-700"><span className="text-[#3b49df] font-semibold">const</span> session = <span className="text-blue-600 font-semibold">createRoom</span>({'{'}<br />&nbsp;&nbsp;team: <span className="text-emerald-600">'distributed'</span>,<br />&nbsp;&nbsp;flow: <span className="text-emerald-600">'in-sync'</span>,<br />&nbsp;&nbsp;mode: <span className="text-emerald-600">'focused'</span><br />{'}'});<br /><br /><span className="text-slate-400 italic">// ship better, together</span><br /><span className="text-[#3b49df] font-semibold">await</span> session.<span className="text-blue-600 font-semibold">collaborate</span>();</div>
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In this room</div>{["Ava", "Mateo", "You"].map((name, i) => <div key={name} className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : i === 1 ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-200 text-slate-700 border border-slate-300'}`}>{name[0]}</span><span className="text-xs font-semibold text-slate-600">{name}</span></div>)}<div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-2 text-[10px] leading-4 font-medium text-blue-700">Mateo updated the API handler</div></div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:-left-7"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-[#3b49df] border border-blue-100"><MousePointer2 size={17} /></span><div><p className="text-xs font-bold text-slate-900">Your cursor is live</p><p className="text-[11px] font-medium text-slate-500">Move as one team</p></div></div>
        </motion.div>
      </section>

      <section className="grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-3">
        {[['One workspace', 'Code, chat, whiteboard, and output'], ['Instant collaboration', 'Invite teammates with one link'], ['Built for momentum', 'A focused interface for getting things done']].map(([title, detail]) => <div key={title} className="flex items-center gap-3 px-3 py-2"><span className="h-8 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-[#3b49df]" /><div><p className="text-sm font-extrabold text-slate-900">{title}</p><p className="text-xs font-medium text-slate-500">{detail}</p></div></div>)}
      </section>

      <section id="how-it-works" className="py-24">
        <div className="max-w-2xl"><p className="text-xs font-bold tracking-[.18em] text-[#3b49df]">SIMPLE BY DESIGN</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] text-slate-900 sm:text-5xl">From idea to shared momentum in three steps.</h2><p className="mt-5 text-base font-medium leading-7 text-slate-600">A deliberate workflow that gets your team collaborating quickly—and keeps the focus on the work.</p></div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">{steps.map(({ icon: Icon, number, title, description }) => <div key={number} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-blue-300"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[#3b49df] border border-blue-100"><Icon size={20} /></span><span className="font-mono-app text-xs font-bold text-slate-400">{number}</span></div><h3 className="mt-8 text-lg font-extrabold text-slate-900">{title}</h3><p className="mt-3 text-sm font-medium leading-6 text-slate-600">{description}</p><div className="mt-7 h-px w-0 bg-gradient-to-r from-cyan-400 to-[#3b49df] transition-all duration-300 group-hover:w-full" /></div>)}</div>
      </section>

      <section id="features" className="grid gap-4 border-t border-slate-200 py-20 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-blue-300"><span className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#3b49df] border border-blue-100"><Icon size={20} /></span><h2 className="text-base font-extrabold text-slate-900">{title}</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-600">{description}</p></div>)}
      </section>

      <section className="relative mb-16 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-[#3b49df] via-blue-600 to-cyan-500 px-6 py-14 text-center shadow-xl sm:px-12"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,.15),transparent_42%)]" /><div className="relative"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/30"><Zap size={21} /></span><h2 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-[-.04em] text-white sm:text-4xl">Ready to make your next session count?</h2><p className="mx-auto mt-4 max-w-lg text-sm font-medium leading-6 text-blue-100">Create a room, invite your team, and keep the best ideas moving.</p><Link to="/start" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#3b49df] shadow-lg transition hover:-translate-y-0.5 hover:shadow-white/30">Start collaborating <ArrowRight size={17} /></Link></div></section>
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 py-7 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Built for teams that care about the craft.</div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500">Created by <a href="https://harshit-singh-profile.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[#3b49df] hover:underline">Harshit Singh</a></span>
          <a href="https://github.com/harshitzofficial" target="_blank" rel="noopener noreferrer" className="transition hover:text-slate-900">GitHub</a>
          <a href="mailto:singh.harshit2810@gmail.com" className="transition hover:text-slate-900">Email</a>
        </div>
      </footer>
    </div>
  </main>
);
