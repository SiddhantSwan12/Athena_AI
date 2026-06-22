import { motion } from "framer-motion";
import { ACCENT_MAP, VERTICAL_META } from "../../lib/VerticalContext";

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
  return (
    <section data-testid="domain-showcase">
      <Panel vertical="finance" />
      <Panel vertical="health" />
      <Panel vertical="education" />
    </section>
  );
}
