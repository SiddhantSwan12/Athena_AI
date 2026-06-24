import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { OwlIcon } from "../Icons";

const PHASES = [
  { glyph: "◈", label: "Searching knowledge base" },
  { glyph: "⟳", label: "Retrieving context" },
  { glyph: "◐", label: "Analyzing relevance" },
  { glyph: "⌬", label: "Cross-referencing sources" },
  { glyph: "◈", label: "Synthesizing answer" },
];

export default function ThinkingDots() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhaseIdx((p) => (p + 1) % PHASES.length);
      setVisible(0);
    }, 2200);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const text = PHASES[phaseIdx].label;
    if (visible < text.length) {
      const t = setTimeout(() => setVisible((v) => v + 1), 38);
      return () => clearTimeout(t);
    }
  }, [phaseIdx, visible]);

  const phase = PHASES[phaseIdx];

  return (
    <motion.div
      data-testid="thinking-indicator"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3"
    >
      <div
        className="w-7 h-7 rounded-lg border border-border bg-surface flex items-center justify-center shrink-0"
        style={{
          boxShadow: "0 0 14px 0 var(--accent-glow, #6B5BFF40)",
          color: "var(--accent, #6B5BFF)",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <OwlIcon size={15} />
        </motion.div>
      </div>

      <div
        className="px-4 py-3 bg-surface border border-border rounded-2xl rounded-bl-sm flex items-center gap-3"
        style={{ minWidth: "260px" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={phaseIdx}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-base leading-none select-none"
            style={{ color: "var(--accent, #6B5BFF)" }}
          >
            {phase.glyph}
          </motion.span>
        </AnimatePresence>

        <span className="font-mono text-xs text-secondary tracking-wide">
          {phase.label.slice(0, visible)}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.65, repeat: Infinity }}
            style={{ color: "var(--accent, #6B5BFF)" }}
          >
            _
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}
