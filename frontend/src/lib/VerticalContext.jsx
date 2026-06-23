import { createContext, useContext, useMemo, useState } from "react";

export const ACCENT_MAP = {
  finance:       { accent: "#6B5BFF", dim: "#6B5BFF18", glow: "0 0 28px 0 #6B5BFF40" },
  health:        { accent: "#2BCD8A", dim: "#2BCD8A18", glow: "0 0 28px 0 #2BCD8A40" },
  education:     { accent: "#E5A14B", dim: "#E5A14B18", glow: "0 0 28px 0 #E5A14B40" },
  technology:    { accent: "#00D2FF", dim: "#00D2FF18", glow: "0 0 28px 0 #00D2FF40" },
  geopolitics:   { accent: "#FF5353", dim: "#FF535318", glow: "0 0 28px 0 #FF535340" },
  law:           { accent: "#B4916C", dim: "#B4916C18", glow: "0 0 28px 0 #B4916C40" },
  environment:   { accent: "#15B77F", dim: "#15B77F18", glow: "0 0 28px 0 #15B77F40" },
  business:      { accent: "#3B82F6", dim: "#3B82F618", glow: "0 0 28px 0 #3B82F640" },
  sports:        { accent: "#FF7E40", dim: "#FF7E4018", glow: "0 0 28px 0 #FF7E4040" },
  entertainment: { accent: "#EC4899", dim: "#EC489918", glow: "0 0 28px 0 #EC489940" },
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
  finance:       { label: "Finance",       sigil: "₣", roman: "I",    description: "Investments, tax, budgeting, markets" },
  health:        { label: "Health",        sigil: "✚", roman: "II",   description: "Medical, fitness, nutrition, wellness" },
  education:     { label: "Education",     sigil: "§", roman: "III",  description: "Learning, courses, concepts, skills" },
  technology:    { label: "Technology",    sigil: "⚙", roman: "IV",   description: "AI, software, hardware, programming" },
  geopolitics:   { label: "Geopolitics",   sigil: "✦", roman: "V",    description: "Diplomacy, elections, international relations" },
  law:           { label: "Law",           sigil: "⚖", roman: "VI",   description: "Legislation, contracts, court rulings" },
  environment:   { label: "Environment",   sigil: "❖", roman: "VII",  description: "Climate, energy, sustainability" },
  business:      { label: "Business",      sigil: "▲", roman: "VIII", description: "Startups, marketing, strategy" },
  sports:        { label: "Sports",        sigil: "✸", roman: "IX",   description: "Games, athletes, tournaments" },
  entertainment: { label: "Entertainment", sigil: "★", roman: "X",    description: "Movies, music, culture, gaming" },
};

export const labelFor = (id) => (id ? VERTICAL_META[id]?.label : "Auto");
