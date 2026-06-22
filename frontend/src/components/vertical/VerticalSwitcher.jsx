import { motion } from "framer-motion";
import { useVertical, ACCENT_MAP } from "../../lib/VerticalContext";
import { AutoIcon, FinanceIcon, HealthIcon, EducationIcon } from "../Icons";

const TABS = [
  { id: "finance",   label: "Finance",   Icon: FinanceIcon },
  { id: "health",    label: "Health",    Icon: HealthIcon },
  { id: "education", label: "Education", Icon: EducationIcon },
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
        className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-medium tracking-[0.04em] transition-colors flex items-center gap-1.5 ${
          !vertical ? "text-primary" : "text-tertiary hover:text-secondary"
        }`}
      >
        {!vertical && (
          <motion.div
            layoutId="vertical-tab-bg"
            className="absolute inset-0 rounded-lg"
            style={{ background: "#6B5BFF18", border: "1px solid #6B5BFF40" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <AutoIcon size={13} />
          Auto
        </span>
      </button>

      {TABS.map((tab) => {
        const map = ACCENT_MAP[tab.id];
        const active = vertical === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            data-testid={`vertical-tab-${tab.id}`}
            onClick={() => setVertical(tab.id)}
            className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-medium tracking-[0.04em] transition-colors flex items-center gap-1.5 ${
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
            <span
              className="relative z-10 flex items-center gap-1.5"
              style={active ? { color: map.accent } : {}}
            >
              <Icon size={13} />
              <span className={active ? "text-primary" : ""}>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
