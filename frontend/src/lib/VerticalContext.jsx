import { createContext, useContext, useMemo, useState } from "react";

export const ACCENT_MAP = {
  finance:   { accent: "#6366F1", dim: "#6366F120", glow: "0 0 24px 0 #6366F130" },
  health:    { accent: "#10B981", dim: "#10B98120", glow: "0 0 24px 0 #10B98130" },
  education: { accent: "#F59E0B", dim: "#F59E0B20", glow: "0 0 24px 0 #F59E0B30" },
};

const FALLBACK = { accent: "#6366F1", dim: "#6366F120", glow: "0 0 24px 0 #6366F130" };

const VerticalContext = createContext({
  vertical: null,
  setVertical: () => {},
  ...FALLBACK,
});

export function VerticalProvider({ children }) {
  const [vertical, setVertical] = useState(null);
  const map = vertical ? ACCENT_MAP[vertical] : FALLBACK;
  const value = useMemo(
    () => ({ vertical, setVertical, accent: map.accent, accentDim: map.dim, accentGlow: map.glow }),
    [vertical, map]
  );
  return (
    <VerticalContext.Provider value={value}>
      <div data-vertical={vertical || "auto"} style={{ display: "contents" }}>
        {children}
      </div>
    </VerticalContext.Provider>
  );
}

export function useVertical() {
  return useContext(VerticalContext);
}

export const VERTICAL_META = {
  finance:   { label: "Finance",   icon: "📈", description: "Investments, tax, budgeting, markets" },
  health:    { label: "Health",    icon: "🩺", description: "Medical, fitness, nutrition, wellness" },
  education: { label: "Education", icon: "🎓", description: "Learning, courses, concepts, skills" },
};

export const labelFor = (id) => (id ? VERTICAL_META[id]?.label : "Auto");
