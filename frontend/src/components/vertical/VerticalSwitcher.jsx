import { motion } from "framer-motion";
import { useVertical, ACCENT_MAP } from "../../lib/VerticalContext";

const TABS = [
  { id: "finance",   label: "Finance",   icon: "📈" },
  { id: "health",    label: "Health",    icon: "🩺" },
  { id: "education", label: "Education", icon: "🎓" },
];

export default function VerticalSwitcher() {
  const { vertical, setVertical } = useVertical();

  return (
    <div
      data-testid="vertical-picker"
      className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border w-fit"
    >
      <button
        data-testid="vertical-tab-auto"
        onClick={() => setVertical(null)}
        className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          !vertical ? "text-primary" : "text-tertiary hover:text-secondary"
        }`}
      >
        {!vertical && (
          <motion.div
            layoutId="vertical-tab-bg"
            className="absolute inset-0 rounded-lg"
            style={{ background: "#6366F120", border: "1px solid #6366F140" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">Auto</span>
      </button>

      {TABS.map((tab) => {
        const map = ACCENT_MAP[tab.id];
        const active = vertical === tab.id;
        return (
          <button
            key={tab.id}
            data-testid={`vertical-tab-${tab.id}`}
            onClick={() => setVertical(tab.id)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              active ? "text-primary" : "text-tertiary hover:text-secondary"
            }`}
          >
            {active && (
              <motion.div
                layoutId="vertical-tab-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: map.dim, border: `1px solid ${map.accent}40` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
