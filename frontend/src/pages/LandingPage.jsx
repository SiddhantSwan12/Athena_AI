import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, FileSearch } from "lucide-react";

import Hero from "../components/landing/Hero";
import FeatureGrid from "../components/landing/FeatureGrid";
import { useAuth } from "../hooks/useAuth";

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-void text-primary relative">
      {/* Top nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-5">
        <Link to="/" className="font-display font-bold text-base tracking-tight">
          Athena<span className="text-tertiary">.ai</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/chat"
              data-testid="landing-open-app"
              className="px-4 py-2 rounded-xl bg-surface hover:bg-border border border-border text-sm font-medium transition-all"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                data-testid="landing-login-btn"
                className="px-3 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                data-testid="landing-signup-btn"
                className="px-4 py-2 rounded-xl bg-primary text-void text-sm font-semibold hover:bg-secondary transition-all"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <Hero ctaLoggedIn={!!user} />
      <FeatureGrid />

      {/* Capability strip */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { Icon: Zap,        title: "Sub-300ms latency", desc: "Tight retrieval and fast generation." },
            { Icon: FileSearch, title: "Cited & grounded",  desc: "Every claim links back to a chunk in your library." },
            { Icon: ShieldCheck,title: "Yours alone",       desc: "Documents tied to your account. JWT-secured." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                <f.Icon className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-primary text-sm">{f.title}</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 sm:px-12 py-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-tertiary font-mono">
        <span>© Athena.ai · Built on Claude Sonnet 4.6 + Gemini</span>
        <span>v1.1.0</span>
      </footer>
    </div>
  );
}
