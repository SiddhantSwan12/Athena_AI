import { createContext, useContext, useMemo, useState } from "react";

export const ACCENT_MAP = {
  finance:   { accent: "#6B5BFF", dim: "#6B5BFF18", glow: "0 0 28px 0 #6B5BFF40" },
  health:    { accent: "#2BCD8A", dim: "#2BCD8A18", glow: "0 0 28px 0 #2BCD8A40" },
  education: { accent: "#E5A14B", dim: "#E5A14B18", glow: "0 0 28px 0 #E5A14B40" },
};

const FALLBACK = { accent: "#6B5BFF", dim: "#6B5BFF18", glow: "0 0 28px 0 #6B5BFF40" };

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
  finance:   { label: "Finance",   sigil: "₣", roman: "I",   description: "Investments, tax, budgeting, markets" },
  health:    { label: "Health",    sigil: "✚", roman: "II",  description: "Medical, fitness, nutrition, wellness" },
  education: { label: "Education", sigil: "§", roman: "III", description: "Learning, courses, concepts, skills" },
};

export const labelFor = (id) => (id ? VERTICAL_META[id]?.label : "Auto");
