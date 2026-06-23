import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACCENT_MAP, VERTICAL_META } from "../../lib/VerticalContext";
import { VERTICAL_ICON } from "../Icons";

const DETAILS = {
  finance: {
    accent: ACCENT_MAP.finance.accent,
    eyebrow: "I. — Finance",
    title: "Markets, taxes,",
    titleItalic: "and stewardship.",
    body: "Athena reads your prospectuses, tax guides, and notes — and answers like a fiduciary, not a chatbot. Every claim is anchored to a chunk you uploaded.",
    sample: "Q. How should I think about asset location across taxable and tax-deferred accounts?",
    facts: [
      ["MPT, est.", "1952"],
      ["Tax docs", "supported"],
      ["Avg. latency", "294 ms"],
    ],
  },
  health: {
    accent: ACCENT_MAP.health.accent,
    eyebrow: "II. — Health",
    title: "Evidence over",
    titleItalic: "anecdote.",
    body: "Upload clinical guidelines, study PDFs, or your own protocols. Athena cites the chunk that justified the claim — so you can fact-check the oracle.",
    sample: "Q. What does the literature say about sleep duration variability and metabolic health?",
    facts: [
      ["Adult sleep", "7–9 hrs"],
      ["Caffeine ½-life", "5–6 hrs"],
      ["CBT-I", "1st-line"],
    ],
  },
  education: {
    accent: ACCENT_MAP.education.accent,
    eyebrow: "III. — Education",
    title: "Concepts you can",
    titleItalic: "actually use.",
    body: "From classical mechanics to machine learning, Athena explains using your own textbooks and notes — the way a patient tutor would.",
    sample: "Q. Walk me through the bias-variance tradeoff using a concrete example from regression.",
    facts: [
      ["Principia", "1687"],
      ["MPT", "Markowitz"],
      ["F = ", "ma"],
    ],
  },
  technology: {
    accent: ACCENT_MAP.technology.accent,
    eyebrow: "IV. — Technology",
    title: "Chips, algorithms,",
    titleItalic: "and codebases.",
    body: "Ingest technical documentations, whitepapers, codebase structures, and system architectures. Cites parameters and design decisions accurately.",
    sample: "Q. Explain the architectural tradeoffs of using a vector index like HNSW vs IVF-PQ.",
    facts: [
      ["Dimensionality", "3072"],
      ["HNSW Search", "O(log N)"],
      ["Code parsing", "Supported"],
    ],
  },
  geopolitics: {
    accent: ACCENT_MAP.geopolitics.accent,
    eyebrow: "V. — Geopolitics",
    title: "Diplomacy, borders,",
    titleItalic: "and conflicts.",
    body: "Upload intelligence briefings, treaty documents, and historical policy analysis. Cross-references geopolitical events with live web searches.",
    sample: "Q. What were the key trade outcomes of the 2024 EU-India bilateral summit?",
    facts: [
      ["Treaty analysis", "Instant"],
      ["Live feeds", "Parallel Search"],
      ["Multi-lingual", "Supported"],
    ],
  },
  law: {
    accent: ACCENT_MAP.law.accent,
    eyebrow: "VI. — Law",
    title: "Statutes, rulings,",
    titleItalic: "and compliance.",
    body: "Analyze legal contracts, regulatory requirements, compliance checklists, and court filings without losing key caveats or clauses.",
    sample: "Q. Does this NDA include a mutual non-solicitation clause and how long does it persist?",
    facts: [
      ["Contract review", "Semantic"],
      ["Compliance", "99.2% accuracy"],
      ["Precedent search", "Real-time"],
    ],
  },
  environment: {
    accent: ACCENT_MAP.environment.accent,
    eyebrow: "VII. — Environment",
    title: "Ecology, climate,",
    titleItalic: "and energy.",
    body: "Understand ESG standards, carbon footprint reports, climate studies, and renewable energy feasibility assessments.",
    sample: "Q. What are the Scope 3 emissions reporting exemptions under the new CSRD guidelines?",
    facts: [
      ["CSRD / ESG", "Fully seeded"],
      ["GHG Protocols", "Supported"],
      ["Lifecycle analysis", "Semantic"],
    ],
  },
  business: {
    accent: ACCENT_MAP.business.accent,
    eyebrow: "VIII. — Business",
    title: "Venture, strategy,",
    titleItalic: "and markets.",
    body: "Evaluate financial reports, business models, pitches, marketing case studies, and supply chain logistics documents.",
    sample: "Q. Summarize the Q3 revenue growth drivers and cost-saving initiatives from the earnings deck.",
    facts: [
      ["SaaS metrics", "Seeded"],
      ["CAGR/LTV logic", "Automatic"],
      ["Competitor analysis", "Cross-doc"],
    ],
  },
  sports: {
    accent: ACCENT_MAP.sports.accent,
    eyebrow: "IX. — Sports",
    title: "Performance, analytics,",
    titleItalic: "and metrics.",
    body: "Analyze athletic training data, sports medicine reports, historical tournament scores, and league analytics.",
    sample: "Q. What does the sports medicine literature say about eccentric loading protocols for patellar tendinopathy?",
    facts: [
      ["Biomechanics", "Seeded"],
      ["Injury protocols", "Sourced"],
      ["Stat tracking", "Tabular"],
    ],
  },
  entertainment: {
    accent: ACCENT_MAP.entertainment.accent,
    eyebrow: "X. — Entertainment",
    title: "Pop culture, media,",
    titleItalic: "and arts.",
    body: "Route queries about movies, albums, streaming analytics, gaming platforms, and pop culture histories.",
    sample: "Q. Compare the box office and critical reception trajectory of the original Dune vs the 2021 adaptation.",
    facts: [
      ["Media trends", "Analyzed"],
      ["Box office tracking", "Live Search"],
      ["Critique database", "Sourced"],
    ],
  },
};

function Panel({ vertical }) {
  const d = DETAILS[vertical];
  const meta = VERTICAL_META[vertical];
  return (
    <article
      data-vertical={vertical}
      data-testid={`showcase-${vertical}`}
      className="relative py-20 sm:py-28 border-b border-border overflow-hidden"
      style={{ "--accent": d.accent }}
    >
      {/* Edge accent */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, transparent 0%, ${d.accent} 35%, ${d.accent} 65%, transparent 100%)` }}
      />
      {/* Background sigil */}
      <span
        aria-hidden
        className="hidden sm:block absolute -right-10 sm:right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none font-display italic font-black"
        style={{
          fontSize: "clamp(220px, 30vw, 440px)",
          color: d.accent,
          opacity: 0.06,
          lineHeight: 1,
        }}
      >
        {meta.roman}
      </span>

      <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left column — heavy editorial */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="marker"
            style={{ color: d.accent }}
          >
            {d.eyebrow}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-primary leading-[0.95] tracking-tight mt-4"
          >
            {d.title}
            <br />
            <em className="italic font-medium" style={{ color: d.accent }}>{d.titleItalic}</em>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 max-w-xl text-secondary text-[1.05rem] leading-[1.7]"
          >
            {d.body}
          </motion.p>

          {/* Facts table */}
          <motion.dl
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 grid grid-cols-3 gap-x-2 max-w-md border-t border-border pt-5"
          >
            {d.facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <dt className="marker">{k}</dt>
                <dd className="font-display italic text-primary text-xl sm:text-2xl tracking-tight tabular">{v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Right column — sample card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 lg:pl-6 lg:border-l lg:border-border"
        >
          <div
            className="relative rounded-xl p-5 border bg-paper/70"
            style={{ borderColor: `${d.accent}30`, boxShadow: `0 0 32px ${d.accent}12` }}
          >
            <div className="flex items-center justify-between mb-3 font-mono text-[10px] uppercase tracking-[0.22em]">
              <span style={{ color: d.accent }}>{vertical}</span>
              <span className="text-quiet tabular">87% match</span>
            </div>
            <p className="font-display italic text-primary text-xl leading-snug">{d.sample}</p>
            <div className="my-4 editorial-rule" />
            <p className="text-secondary text-sm leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] mr-2" style={{ color: d.accent }}>a.</span>
              Grounded in <em className="italic" style={{ color: d.accent }}>your library</em>. Citations are real chunks, not vibes. Hover a chunk to see the original passage — and trust the answer.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["chunk_1", "chunk_2", "chunk_3"].map((c) => (
                <span key={c}
                  className="px-2 py-0.5 rounded-md font-mono text-[10px]"
                  style={{ color: d.accent, background: `${d.accent}10`, border: `1px solid ${d.accent}25` }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </article>
  );
}

export default function DomainShowcase() {
  const [activeCard, setActiveCard] = useState("technology");

  const otherVerticals = [
    "technology",
    "geopolitics",
    "law",
    "environment",
    "business",
    "sports",
    "entertainment",
  ];

  return (
    <section data-testid="domain-showcase">
      {/* 3 Main Panels */}
      <Panel vertical="finance" />
      <Panel vertical="health" />
      <Panel vertical="education" />

      {/* Expanded Domains Showcase */}
      <section className="px-6 py-24 max-w-6xl mx-auto" id="extended-domains">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="marker">§ Extended Vocabularies</p>
          <h2 className="font-display text-primary text-4xl sm:text-5xl tracking-tight mt-4">
            Seven more domains. <br />
            <em className="italic font-medium text-finance">Deep specialization.</em>
          </h2>
          <p className="mt-4 text-secondary text-[1rem] leading-[1.7]">
            Athena is built to understand jargon. Click any domain below to preview how she reads, routes, and answers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Selectors Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherVerticals.map((id) => {
              const Icon = VERTICAL_ICON[id];
              const meta = VERTICAL_META[id];
              const active = activeCard === id;
              const accentColor = ACCENT_MAP[id].accent;

              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveCard(id)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 360, damping: 24 }}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    active
                      ? "bg-surface text-primary"
                      : "bg-paper/40 border-border/80 text-tertiary hover:bg-paper hover:text-secondary"
                  }`}
                  style={{
                    borderColor: active ? `${accentColor}40` : "var(--border)",
                    boxShadow: active ? `0 0 20px 0 ${accentColor}10` : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="relative p-2 rounded-xl border"
                      style={{
                        background: active ? `${accentColor}12` : "rgba(0,0,0,0.2)",
                        borderColor: active ? `${accentColor}30` : "var(--border)",
                      }}
                    >
                      {active && (
                        <motion.span
                          layoutId="domain-active-spark"
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{ boxShadow: `0 0 22px ${accentColor}24` }}
                        />
                      )}
                      <Icon size={16} style={{ color: active ? accentColor : "var(--secondary)" }} />
                    </div>
                    <span className="font-mono text-[9px] text-tertiary">{meta.roman}</span>
                  </div>
                  <h3 className={`font-display text-base font-semibold ${active ? "text-primary" : "text-secondary"}`}>
                    {meta.label}
                  </h3>
                  <p className="text-[11px] text-tertiary mt-1.5 leading-relaxed line-clamp-2">
                    {meta.description}
                  </p>
                  <div className="mt-4 grid grid-cols-5 gap-1">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <motion.span
                        key={n}
                        className="h-1 rounded-full"
                        animate={
                          active
                            ? { backgroundColor: [accentColor, "#2E2932", accentColor] }
                            : { backgroundColor: "#2E2932" }
                        }
                        transition={{ duration: 1.4, repeat: active ? Infinity : 0, delay: n * 0.12 }}
                      />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Interactive Preview Panel */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {activeCard && (
                <motion.div
                  key={activeCard}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl p-6 border bg-paper border-border flex flex-col relative overflow-hidden"
                  style={{
                    borderColor: `${ACCENT_MAP[activeCard].accent}30`,
                    boxShadow: `0 12px 40px -10px rgba(0,0,0,0.6), 0 0 32px 0 ${ACCENT_MAP[activeCard].accent}10`,
                  }}
                >
                  {/* Watermark Roman numeral */}
                  <span
                    className="absolute right-2 bottom-0 select-none pointer-events-none font-display italic font-black text-[120px]"
                    style={{
                      color: ACCENT_MAP[activeCard].accent,
                      opacity: 0.04,
                      lineHeight: 1,
                    }}
                  >
                    {VERTICAL_META[activeCard].roman}
                  </span>

                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: ACCENT_MAP[activeCard].accent }}
                      />
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.2em] font-semibold"
                        style={{ color: ACCENT_MAP[activeCard].accent }}
                      >
                        {VERTICAL_META[activeCard].label} Focus
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-quiet">
                      {DETAILS[activeCard].eyebrow}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl text-primary leading-tight">
                    {DETAILS[activeCard].title} <br />
                    <em
                      className="italic font-medium"
                      style={{ color: ACCENT_MAP[activeCard].accent }}
                    >
                      {DETAILS[activeCard].titleItalic}
                    </em>
                  </h3>

                  <p className="text-secondary text-xs mt-4 leading-relaxed">
                    {DETAILS[activeCard].body}
                  </p>

                  <div className="my-5 border-t border-border/80" />

                  <div className="bg-surface/50 rounded-xl p-4 border border-border/50">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-quiet">
                      Sample Query
                    </span>
                    <p className="font-display italic text-primary text-sm mt-1 leading-snug">
                      {DETAILS[activeCard].sample}
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-border/50 bg-surface/30 p-3">
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-quiet">
                      <span>routing trace</span>
                      <span style={{ color: ACCENT_MAP[activeCard].accent }}>classified</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {["q", "embed", "top-k", "cite"].map((step, i) => (
                        <div key={step} className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="sr-only">{step}</span>
                          <span className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <motion.span
                              className="block h-full rounded-full"
                              style={{ background: ACCENT_MAP[activeCard].accent }}
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.35, delay: i * 0.12 }}
                            />
                          </span>
                          {i < 3 && <span className="text-quiet font-mono text-[9px]">›</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-quiet">
                      Facts & Seeded Data
                    </span>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {DETAILS[activeCard].facts.map(([k, v]) => (
                        <div
                          key={k}
                          className="px-2.5 py-1.5 rounded-lg bg-surface/30 border border-border/40 text-center"
                        >
                          <p className="text-[8px] font-mono uppercase text-tertiary truncate">
                            {k}
                          </p>
                          <p
                            className="font-display italic text-xs font-semibold mt-0.5 truncate"
                            style={{ color: ACCENT_MAP[activeCard].accent }}
                          >
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </section>
  );
}
