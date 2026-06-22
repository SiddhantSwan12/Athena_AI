import { motion } from "framer-motion";
import { OwlIcon } from "../Icons";

export default function ThinkingDots() {
  return (
    <motion.div
      data-testid="thinking-indicator"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3"
    >
      <div
        className="w-7 h-7 rounded-lg border border-border bg-surface flex items-center justify-center shrink-0"
        style={{ boxShadow: "0 0 12px 0 var(--accent-glow, #6B5BFF40)", color: "var(--accent, #6B5BFF)" }}
      >
        <OwlIcon size={15} />
      </div>
      <div className="px-4 py-3 bg-surface border border-border rounded-2xl rounded-bl-sm flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent, #6B5BFF)" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <span className="text-tertiary text-xs font-mono ml-1">Athena is thinking</span>
      </div>
    </motion.div>
  );
}
