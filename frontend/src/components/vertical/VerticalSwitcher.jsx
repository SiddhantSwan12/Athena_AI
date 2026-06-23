import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVertical, ACCENT_MAP, VERTICAL_META } from "../../lib/VerticalContext";
import { ChevronDown } from "lucide-react";
import { AutoIcon, VERTICAL_ICON } from "../Icons";

export default function VerticalSwitcher() {
  const { vertical, setVertical } = useVertical();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentMeta = vertical ? VERTICAL_META[vertical] : null;
  const CurrentIcon = vertical ? VERTICAL_ICON[vertical] : AutoIcon;
  const currentAccent = vertical ? ACCENT_MAP[vertical].accent : "#6B5BFF";

  return (
    <div className="relative" ref={containerRef} data-testid="vertical-picker">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-border text-xs font-medium transition-all hover:bg-surface/80"
        style={{
          borderColor: vertical ? `${currentAccent}35` : "var(--border)",
          boxShadow: vertical ? `0 0 12px 0 ${currentAccent}10` : "none",
        }}
      >
        <CurrentIcon size={14} style={{ color: currentAccent }} />
        <span className="text-secondary">{vertical ? currentMeta.label : "Auto"}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 rounded-2xl bg-paper border border-border p-2 shadow-xl z-50 backdrop-blur-md"
            style={{
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary font-mono px-3 py-1.5 border-b border-border mb-1.5 flex justify-between">
              <span>Select Domain</span>
              <span>Focus</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
              {/* Auto Tab */}
              <button
                data-testid="vertical-tab-auto"
                onClick={() => {
                  setVertical(null);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition-all flex items-start gap-2.5 ${
                  !vertical ? "bg-surface text-primary" : "text-tertiary hover:bg-surface/50 hover:text-secondary"
                }`}
              >
                <AutoIcon size={14} className="mt-0.5 text-finance" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={!vertical ? "text-primary font-semibold" : ""}>Auto-route</span>
                    <span className="text-[9px] px-1 py-0.2 rounded border border-border text-tertiary uppercase tracking-wider font-mono">default</span>
                  </div>
                  <p className="text-[10px] text-tertiary mt-0.5">Classifies and retrieves across all domains automatically.</p>
                </div>
              </button>

              {Object.entries(VERTICAL_META).map(([id, meta]) => {
                const Icon = VERTICAL_ICON[id];
                const active = vertical === id;
                const map = ACCENT_MAP[id];

                return (
                  <button
                    key={id}
                    data-testid={`vertical-tab-${id}`}
                    onClick={() => {
                      setVertical(id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium transition-all flex items-start gap-2.5 ${
                      active ? "bg-surface text-primary" : "text-tertiary hover:bg-surface/50 hover:text-secondary"
                    }`}
                    style={active ? { borderLeft: `2.5px solid ${map.accent}` } : {}}
                  >
                    <Icon size={14} className="mt-0.5" style={{ color: map.accent }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={active ? "text-primary font-semibold" : "text-secondary"}>{meta.label}</span>
                        <span className="font-mono text-[9px] text-tertiary tabular">{meta.roman}</span>
                      </div>
                      <p className="text-[10px] text-tertiary mt-0.5 truncate">{meta.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
