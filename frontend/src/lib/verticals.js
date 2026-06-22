export const VERTICALS = [
  {
    id: "finance",
    label: "Finance",
    icon: "TrendingUp",
    accent: "#6366F1",
    dim: "rgba(99,102,241,0.18)",
    description: "Investments, tax, budgeting, markets",
  },
  {
    id: "health",
    label: "Health",
    icon: "HeartPulse",
    accent: "#10B981",
    dim: "rgba(16,185,129,0.18)",
    description: "Medical, fitness, nutrition, wellness",
  },
  {
    id: "education",
    label: "Education",
    icon: "GraduationCap",
    accent: "#F59E0B",
    dim: "rgba(245,158,11,0.18)",
    description: "Learning, courses, concepts, skills",
  },
];

export const verticalById = (id) => VERTICALS.find((v) => v.id === id);

export const accentClassFor = (id) => {
  if (id === "finance") return "accent-finance";
  if (id === "health") return "accent-health";
  if (id === "education") return "accent-education";
  return "accent-auto";
};

export const labelFor = (id) => {
  if (!id) return "Auto";
  return verticalById(id)?.label || "Auto";
};
