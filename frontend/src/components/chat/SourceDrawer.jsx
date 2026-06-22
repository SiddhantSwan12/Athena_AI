import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVertical, ACCENT_MAP } from "../../lib/VerticalContext";

export default function SourceDrawer({ sources, messageVertical }) {
  const [open, setOpen] = useState(false);
  const { accent: ctxAccent } = useVertical();
  // Use this message's own vertical accent if available, fall back to context
  const accent = messageVertical && ACCENT_MAP[messageVertical] ? ACCENT_MAP[messageVertical].accent : ctxAccent;

  if (!sources?.length) return null;

  return (
    <div className="w-full" data-testid="source-list">
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="source-toggle"
        className="flex items-center gap-1.5 text-[11px] font-mono transition-colors"
        style={{ color: open ? accent : "#4B5563" }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          ›
        </motion.span>
        {sources.length} source{sources.length !== 1 ? "s" : ""}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden mt-2 space-y-2"
          >
            {sources.map((src, i) => (
              <div
                key={src.id || i}
                data-testid={`source-card-${i}`}
                className="px-3 py-2.5 rounded-lg border text-xs font-mono"
                style={{ borderColor: `${accent}25`, background: `${accent}06` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: accent }}>
                    chunk_{i + 1}
                    {src.title ? (
                      <span className="text-tertiary"> · {src.title}</span>
                    ) : null}
                  </span>
                  <span className="text-tertiary">
                    {(Number(src.similarity || 0) * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="text-secondary leading-relaxed line-clamp-3">{src.content}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
