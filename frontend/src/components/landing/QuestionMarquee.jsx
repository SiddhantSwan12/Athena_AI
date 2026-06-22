import { motion } from "framer-motion";
import { ACCENT_MAP } from "../../lib/VerticalContext";

const QUESTIONS = [
  { v: "finance",   q: "How do I rebalance a 60/40 portfolio?" },
  { v: "health",    q: "What's the half-life of caffeine?" },
  { v: "education", q: "Explain Noether's theorem in two sentences." },
  { v: "finance",   q: "Roth vs traditional 401(k) — which is right for me?" },
  { v: "health",    q: "Evidence-based protocols for resistance training." },
  { v: "education", q: "Why is the bias-variance tradeoff so fundamental?" },
  { v: "finance",   q: "When do I owe quarterly estimated taxes?" },
  { v: "health",    q: "Magnesium glycinate vs citrate for sleep?" },
  { v: "education", q: "Walk me through Newton's third law with rockets." },
  { v: "finance",   q: "How should I think about asset location?" },
  { v: "health",    q: "Tracking macros: protein per kg of body weight?" },
  { v: "education", q: "Why does cross-validation help avoid overfitting?" },
];

function Row({ items, direction = "left", duration = 60 }) {
  // Duplicate for seamless loop
  const stream = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-3 whitespace-nowrap"
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {stream.map((item, i) => {
          const c = ACCENT_MAP[item.v].accent;
          return (
            <span
              key={`${i}-${item.q}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-paper/60 font-mono text-[12px] shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
              <span className="text-quiet uppercase tracking-[0.18em] text-[10px]">{item.v}</span>
              <span className="text-secondary">{item.q}</span>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function QuestionMarquee() {
  const rowA = QUESTIONS.slice(0, 6).concat(QUESTIONS.slice(6, 9));
  const rowB = QUESTIONS.slice(9).concat(QUESTIONS.slice(0, 6));
  return (
    <section
      data-testid="question-marquee"
      className="relative py-14 border-y border-border bg-paper paper-noise overflow-hidden"
    >
      <div className="relative z-10 px-6 flex items-center justify-between max-w-6xl mx-auto mb-6">
        <p className="marker">questions · in the wild</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet tabular">
          ∞ · streaming
        </p>
      </div>
      <div className="space-y-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <Row items={rowA} direction="left"  duration={70} />
        <Row items={rowB} direction="right" duration={90} />
      </div>
    </section>
  );
}
