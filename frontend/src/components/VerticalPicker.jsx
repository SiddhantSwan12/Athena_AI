import { TrendingUp, HeartPulse, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "../lib/cn";
import { VERTICALS, accentClassFor } from "../lib/verticals";

const ICON_MAP = {
  TrendingUp,
  HeartPulse,
  GraduationCap,
};

export default function VerticalPicker({ selected, onChange, size = "md" }) {
  const px = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  return (
    <div
      data-testid="vertical-picker"
      className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl glass"
    >
      <button
        data-testid="vertical-tab-auto"
        onClick={() => onChange(undefined)}
        className={cn(
          accentClassFor(undefined),
          "flex items-center gap-1.5 rounded-xl text-sm font-medium transition-all duration-300",
          px,
          !selected
            ? "bg-white/10 text-white shadow-accent"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Sparkles className="w-4 h-4" />
        Auto
      </button>
      {VERTICALS.map((v) => {
        const Icon = ICON_MAP[v.icon];
        const active = selected === v.id;
        return (
          <button
            key={v.id}
            data-testid={`vertical-tab-${v.id}`}
            onClick={() => onChange(v.id)}
            className={cn(
              accentClassFor(v.id),
              "flex items-center gap-1.5 rounded-xl text-sm font-medium transition-all duration-300",
              px,
              active
                ? "bg-white/10 text-white shadow-accent"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
            title={v.description}
          >
            <Icon className="w-4 h-4" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
