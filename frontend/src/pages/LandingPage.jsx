import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, HeartPulse, GraduationCap, ShieldCheck, Zap, FileSearch } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen athena-bg grain relative overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🦉</span>
          <span className="font-heading text-lg font-semibold tracking-tight">Athena.ai</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/chat"
              data-testid="landing-open-app"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium border border-white/10 transition-all hover:-translate-y-0.5"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                data-testid="landing-login-btn"
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                data-testid="landing-signup-btn"
                className="px-4 py-2 rounded-xl bg-white text-[#0A0F1E] text-sm font-semibold hover:bg-slate-100 transition-all hover:-translate-y-0.5"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 sm:px-12 pt-16 sm:pt-24 pb-20 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-slate-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-athena" />
          Powered by Claude Sonnet 4.6 · Gemini · pgvector-style retrieval
        </div>
        <h1 className="font-heading text-5xl sm:text-7xl font-light tracking-tighter leading-[1.05] text-white max-w-4xl">
          The owl that <span className="text-transparent bg-clip-text bg-gradient-to-r from-finance via-athena to-education">knows</span> your domain.
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Athena.ai is a multi-domain RAG assistant. Upload your documents,
          ask anything — questions get auto-routed to <span className="text-finance font-medium">Finance</span>,{" "}
          <span className="text-health font-medium">Health</span>, or{" "}
          <span className="text-education font-medium">Education</span> with grounded, cited answers in &lt;300ms.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            to={user ? "/chat" : "/signup"}
            data-testid="landing-cta-primary"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#0A0F1E] font-semibold transition-all hover:-translate-y-0.5"
          >
            {user ? "Continue chatting" : "Start free"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to={user ? "/upload" : "/login"}
            data-testid="landing-cta-secondary"
            className="px-6 py-3 rounded-2xl glass text-sm font-medium hover:bg-white/[0.06] transition-all"
          >
            Upload your first document →
          </Link>
        </div>
      </section>

      {/* Vertical cards */}
      <section className="relative z-10 px-6 sm:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "finance",  Icon: TrendingUp,    color: "#6366F1", title: "Finance",   desc: "Portfolio theory, tax code, market mechanics — grounded in your uploads." },
            { id: "health",   Icon: HeartPulse,    color: "#10B981", title: "Health",    desc: "Clinical guidelines, nutrition science, mental health primers." },
            { id: "education",Icon: GraduationCap, color: "#F59E0B", title: "Education", desc: "Pedagogy, concepts, history & STEM — cited line by line." },
          ].map((v) => (
            <div
              key={v.id}
              data-testid={`landing-vertical-${v.id}`}
              className="group p-6 rounded-2xl glass transition-all hover:-translate-y-1 hover:bg-white/[0.06]"
              style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: v.color + "20" }}>
                  <v.Icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3 className="font-heading text-xl font-medium text-white">{v.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
              <div className="mt-4 text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: v.color }}>
                Auto-routed
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="relative z-10 px-6 sm:px-12 pb-32 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { Icon: Zap, title: "Sub-300ms latency", desc: "Tight retrieval + streamed generation." },
            { Icon: FileSearch, title: "Cited & grounded", desc: "Every claim links to chunks in your library." },
            { Icon: ShieldCheck, title: "Yours alone", desc: "Documents tied to your account. JWT-secured." },
          ].map((f, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                <f.Icon className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <p className="font-medium text-white">{f.title}</p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 sm:px-12 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>© Athena.ai · Built on Claude Sonnet 4.6 + Gemini</span>
        <span className="font-mono">v1.0.0</span>
      </footer>
    </div>
  );
}
