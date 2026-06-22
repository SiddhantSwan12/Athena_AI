import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import Hero from "../components/landing/Hero";
import QuestionMarquee from "../components/landing/QuestionMarquee";
import DomainShowcase from "../components/landing/DomainShowcase";
import Schematic from "../components/landing/Schematic";
import { useAuth } from "../hooks/useAuth";

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-ink text-primary relative">
      {/* Nav */}
      <nav className="relative z-30 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-border bg-ink/70 backdrop-blur-md">
        <Link to="/" className="wordmark text-xl text-primary" data-testid="brand-link">
          Athena<span className="text-tertiary not-italic font-mono font-normal text-sm align-super ml-0.5">.ai</span>
        </Link>
        <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.22em] text-tertiary">
          <a href="#showcase" className="px-3 py-1 hover:text-primary transition-colors link-line">Domains</a>
          <span className="text-quiet">·</span>
          <a href="#pipeline" className="px-3 py-1 hover:text-primary transition-colors link-line">Pipeline</a>
          <span className="text-quiet">·</span>
          <Link to="/upload" className="px-3 py-1 hover:text-primary transition-colors link-line">Index</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/chat"
              data-testid="landing-open-app"
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary border border-border px-4 py-2 rounded-full hover:border-muted transition-colors"
            >
              Open terminal →
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                data-testid="landing-login-btn"
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-tertiary hover:text-primary transition-colors px-2 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                data-testid="landing-signup-btn"
                className="font-display italic text-primary text-sm border border-primary/40 px-4 py-2 rounded-full hover:border-primary transition-colors"
              >
                Begin →
              </Link>
            </>
          )}
        </div>
      </nav>

      <Hero ctaLoggedIn={!!user} />

      <QuestionMarquee />

      {/* Section header for showcase */}
      <section className="px-6 pt-24 pb-6 max-w-6xl mx-auto" id="showcase">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7">
            <p className="marker">§ The Three Domains</p>
            <h2 className="font-display text-primary text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight mt-4">
              One oracle. <em className="italic font-medium">Three vocabularies.</em>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-secondary text-[1rem] leading-[1.75]">
              Each domain has its own colour, its own corpus, its own
              <em className="italic"> dialect</em>. Athena learns from the documents you give her and answers in the register the question demands.
            </p>
          </div>
        </div>
      </section>

      <DomainShowcase />

      <div id="pipeline" />
      <Schematic />

      {/* CTA strip */}
      <section className="relative px-6 py-24 sm:py-32 border-t border-border bg-paper paper-noise">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="marker">An invitation</p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-display text-primary leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
          >
            Bring your library. <br />
            <em className="italic font-medium">Ask anything.</em>
          </motion.h2>
          <p className="mt-6 text-secondary text-[1.05rem] leading-[1.7] max-w-xl mx-auto">
            Athena indexes your documents into a private vector store, routes
            every question to the right domain, and answers
            <em className="italic"> with citations</em>. Free to begin.
          </p>
          <div className="mt-10 flex items-center justify-center gap-5 flex-wrap">
            <Link
              to={user ? "/chat" : "/signup"}
              data-testid="landing-cta-bottom"
              className="group inline-flex items-center gap-2 font-display italic text-primary text-2xl tracking-tight border-b border-primary/40 pb-1 hover:border-primary transition-colors"
            >
              {user ? "Open the terminal" : "Begin asking"}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 sm:px-10 py-8 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-quiet tabular">
        <span>© Athena · MMXXVI</span>
        <span>Claude · Gemini · Mongo · Inter Tight · Fraunces · JetBrains Mono</span>
        <span>v1.2.0</span>
      </footer>
    </div>
  );
}
