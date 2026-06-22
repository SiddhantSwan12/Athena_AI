import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const DOMAINS = [
  {
    id: "finance",
    label: "Finance",
    icon: "📈",
    accent: "#6366F1",
    dim: "#6366F110",
    description: "Portfolio analysis, tax queries, market research — grounded in your uploaded documents.",
    tags: ["Investments", "Tax", "Markets", "Banking"],
  },
  {
    id: "health",
    label: "Health",
    icon: "🩺",
    accent: "#10B981",
    dim: "#10B98110",
    description: "Medical questions, nutrition, fitness — accurate answers from verified sources.",
    tags: ["Medical", "Nutrition", "Fitness", "Mental Health"],
  },
  {
    id: "education",
    label: "Education",
    icon: "🎓",
    accent: "#F59E0B",
    dim: "#F59E0B10",
    description: "Concept explanations, study support, research — across every discipline.",
    tags: ["Science", "History", "Math", "Skills"],
  },
];

function TiltCard({ domain }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 20 });
  const springY = useSpring(y, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-6deg", "6deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.2 }}
      className="group relative p-6 rounded-2xl border cursor-default overflow-hidden"
      data-testid={`landing-vertical-${domain.id}`}
    >
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${domain.dim} 0%, #0A0F1E 100%)` }}
      />
      <div
        className="absolute inset-0 rounded-2xl border opacity-100"
        style={{ borderColor: `${domain.accent}30`, borderWidth: 1 }}
      />
      {/* Soft hover glow */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `0 0 40px 0 ${domain.accent}25` }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{domain.icon}</span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: domain.accent }}
          >
            auto-routed
          </span>
        </div>
        <h3 className="mt-3 font-display font-bold text-xl text-primary">{domain.label}</h3>
        <p className="mt-2 text-secondary text-sm leading-relaxed">{domain.description}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {domain.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono"
              style={{ background: `${domain.accent}15`, color: domain.accent }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureGrid() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto relative">
      <p className="text-center text-tertiary font-mono text-xs uppercase tracking-[0.25em] mb-3">
        Three domains · One interface
      </p>
      <h2 className="text-center font-display font-bold text-3xl sm:text-4xl text-primary mb-12 tracking-tight">
        Ask anything, in any domain.
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DOMAINS.map((d) => (
          <TiltCard key={d.id} domain={d} />
        ))}
      </div>
    </section>
  );
}
