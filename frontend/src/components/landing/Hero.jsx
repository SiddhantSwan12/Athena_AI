import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Link } from "react-router-dom";

import LiveDemo from "./LiveDemo";

const FLOW_CARDS = [
  { tag: "doc.pdf", sub: "indexed", c: "#6B5BFF", left: "6%", top: "29%", x: [0, 70, 155, 245], y: [8, -18, 16, -4], rotate: [-3, 1, -1, 2], delay: 0 },
  { tag: "chunk_02", sub: "embedded", c: "#2BCD8A", left: "12%", top: "61%", x: [0, 95, 185, 310], y: [16, 0, -22, -12], rotate: [2, -1, 1, -2], delay: 1.2 },
  { tag: "web_03", sub: "live source", c: "#00D2FF", left: "67%", top: "23%", x: [20, -40, -10, 34], y: [0, 18, -14, 8], rotate: [1, -2, 2, 0], delay: 2.1 },
  { tag: "cite_04", sub: "answer", c: "#E5A14B", left: "62%", top: "70%", x: [-18, 30, 88, 130], y: [8, -10, 5, -16], rotate: [-2, 1, -1, 2], delay: 3.0 },
];

function KnowledgeFlowField({ active }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none route-mask" aria-hidden>
      <motion.svg
        className="absolute inset-x-0 top-12 h-[620px] w-full opacity-70"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="knowledgeFlowGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6B5BFF" stopOpacity="0.02" />
            <stop offset="50%" stopColor={active ? "var(--accent)" : "#6B5BFF"} stopOpacity="0.36" />
            <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.02" />
          </linearGradient>
          <filter id="flowGlow">
            <feGaussianBlur stdDeviation="0.45" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[
          "M 0 67 C 24 44, 43 48, 58 38 S 83 28, 100 42",
          "M 4 28 C 24 34, 36 62, 58 57 S 77 52, 100 24",
          "M 0 84 C 26 72, 40 74, 62 68 S 82 64, 100 74",
        ].map((path, i) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#knowledgeFlowGradient)"
            strokeWidth="0.16"
            strokeDasharray="1.2 3.8"
            filter="url(#flowGlow)"
            animate={{ strokeDashoffset: [0, -24] }}
            transition={{ duration: 7 + i * 1.8, repeat: Infinity, ease: "linear" }}
          />
        ))}
        {[18, 38, 58, 78].map((x, i) => (
          <motion.circle
            key={x}
            cx={x}
            cy={i % 2 ? 58 : 42}
            r="0.34"
            fill={active ? "var(--accent)" : "#6B5BFF"}
            animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.5, 0.6] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.55 }}
          />
        ))}
      </motion.svg>

      {FLOW_CARDS.map((card) => (
        <motion.div
          key={card.tag}
          className="absolute hidden lg:block w-[142px] rounded-lg border bg-paper/45 backdrop-blur-sm px-3 py-2 font-mono"
          style={{
            left: card.left,
            top: card.top,
            borderColor: `${card.c}28`,
            boxShadow: `0 16px 44px -26px ${card.c}`,
          }}
          animate={{
            x: card.x,
            y: card.y,
            rotate: card.rotate,
            opacity: [0, 0.78, 0.78, 0],
            scale: [0.94, 1, 1, 0.96],
          }}
          transition={{ duration: 7.6, repeat: Infinity, delay: card.delay, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: card.c }}>{card.tag}</span>
            <span className="w-1 h-1 rounded-full" style={{ background: card.c }} />
          </div>
          <div className="mt-2 space-y-1">
            <span className="block h-1 rounded-full bg-muted" />
            <span className="block h-1 rounded-full bg-muted w-4/5" />
            <span className="block h-1 rounded-full bg-muted w-2/3" />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-tertiary">{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function Hero({ ctaLoggedIn }) {
  const headlineRef = useRef(null);
  const subRef = useRef(null);
  const metaRef = useRef(null);
  const [pageAccent, setPageAccent] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const starts = {
        left: { x: -86, y: 0, rotation: -2, scale: 1 },
        right: { x: 86, y: 0, rotation: 2, scale: 1 },
        bottom: { x: 0, y: 68, rotation: 0, scale: 0.98 },
        top: { x: 0, y: -54, rotation: 0, scale: 0.98 },
        deep: { x: 0, y: 24, rotation: 0, scale: 0.88 },
      };
      const words = gsap.utils.toArray(headlineRef.current?.querySelectorAll(".gsap-word") || []);
      tl.fromTo(metaRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 })
        .fromTo(
          words,
          {
            x: (_, el) => starts[el.dataset.enter || "bottom"].x,
            y: (_, el) => starts[el.dataset.enter || "bottom"].y,
            rotation: (_, el) => starts[el.dataset.enter || "bottom"].rotation,
            scale: (_, el) => starts[el.dataset.enter || "bottom"].scale,
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.05,
            stagger: 0.075,
          },
          "-=0.3"
        )
        .fromTo(subRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, "-=0.55")
        .to(
          headlineRef.current?.querySelectorAll(".hero-blink") || [],
          {
            opacity: 0.58,
            textShadow: "0 0 24px var(--accent-glow)",
            duration: 0.18,
            repeat: 3,
            yoyo: true,
            stagger: 0.08,
            ease: "steps(1)",
          },
          "-=0.2"
        );

      gsap.to(headlineRef.current?.querySelectorAll(".hero-breathe") || [], {
        textShadow: "0 0 22px var(--accent-glow)",
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.8,
      });
    });
    return () => ctx.revert();
  }, []);

  const accentStyle = pageAccent ? { color: "var(--accent)" } : {};

  return (
    <section
      data-testid="hero"
      data-vertical={pageAccent || "auto"}
      className="relative pt-12 pb-16 sm:pt-20 sm:pb-24"
    >
      {/* Soft accent halo, top-right, follows resolved vertical */}
      <motion.div
        aria-hidden
        className="absolute top-0 right-[-10%] w-[700px] h-[700px] rounded-full pointer-events-none"
        animate={{ background: pageAccent ? "radial-gradient(ellipse at center, var(--accent-dim) 0%, transparent 70%)" : "radial-gradient(ellipse at center, #6B5BFF12 0%, transparent 70%)" }}
        transition={{ duration: 0.7 }}
        style={{ filter: "blur(50px)" }}
      />
      <div className="absolute inset-0 dot-grid pointer-events-none opacity-50" />
      <KnowledgeFlowField active={pageAccent} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* LEFT — Editorial column */}
        <div className="lg:col-span-6">
          <div ref={metaRef} className="flex items-center gap-3 mb-7">
            <span className="marker">№ 01</span>
            <div className="h-px w-12 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet">an oracle for the curious</span>
          </div>

          <h1
            ref={headlineRef}
            className="font-display text-primary tracking-tight leading-[0.92]"
            style={{ fontSize: "clamp(56px, 8vw, 112px)" }}
          >
            <span className="gsap-word inline-block" data-enter="left">She</span>{" "}
            <span className="gsap-word inline-block" data-enter="right">reads</span>
            <br />
            <span className="gsap-word inline-block" data-enter="bottom">your</span>{" "}
            <em className="gsap-word hero-blink hero-breathe italic font-medium inline-block" data-enter="deep" style={accentStyle}>library,</em>
            <br />
            <span className="gsap-word inline-block" data-enter="left">and</span>{" "}
            <span className="gsap-word inline-block" data-enter="right">answers</span>
            <br />
            <em className="gsap-word hero-blink italic font-medium inline-block" data-enter="top">like a scholar.</em>
          </h1>

          <p
            ref={subRef}
            className="mt-8 max-w-md text-secondary text-[1.05rem] leading-[1.75]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet mr-2">Athena</span>
            is a multi-domain oracle. Drop in your PDFs across
            <em className="italic"> ten specialized domains</em> (including finance, health, technology, geopolitics, and law), and ask anything — she routes,
            retrieves, and cites her sources <strong className="text-primary font-medium">in under 300 ms</strong>.
          </p>

          <div className="mt-9 flex items-center gap-5 flex-wrap">
            <Link
              to={ctaLoggedIn ? "/chat" : "/signup"}
              data-testid="landing-cta-primary"
              className="group inline-flex items-center gap-2 font-display italic text-primary text-2xl tracking-tight border-b border-primary/30 pb-1 hover:border-primary transition-colors"
            >
              {ctaLoggedIn ? "Open the terminal" : "Consult the oracle"}
              <motion.span
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 6 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                →
              </motion.span>
            </Link>
            <Link
              to={ctaLoggedIn ? "/upload" : "/login"}
              data-testid="landing-cta-secondary"
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-tertiary hover:text-secondary transition-colors link-line"
            >
              {ctaLoggedIn ? "+ index a document" : "sign in"}
            </Link>
          </div>

          {/* Vital stats — small editorial row */}
          <dl className="mt-12 grid grid-cols-3 gap-x-3 max-w-md border-t border-border pt-5">
            <div>
              <dt className="marker">retrieval</dt>
              <dd className="font-display italic text-primary text-xl tracking-tight tabular mt-1">
                top-5 · 0.55τ
              </dd>
            </div>
            <div>
              <dt className="marker">embedding</dt>
              <dd className="font-display italic text-primary text-xl tracking-tight tabular mt-1">3072 dim</dd>
            </div>
            <div>
              <dt className="marker">latency</dt>
              <dd className="font-display italic text-primary text-xl tracking-tight tabular mt-1">≈ 294 ms</dd>
            </div>
          </dl>

          <motion.div
            className="mt-8 max-w-md rounded-xl border border-border bg-paper/45 p-3 overflow-hidden"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.9 }}
          >
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-quiet">
              <span>live route</span>
              <span className="tabular" style={pageAccent ? { color: "var(--accent)" } : {}}>rag · citations</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {["ingest", "embed", "retrieve", "answer"].map((step, i) => (
                <div key={step} className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: pageAccent ? "var(--accent)" : "#6B5BFF" }}
                    animate={{ x: ["-100%", "0%", "100%"] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Live demo terminal */}
        <div className="lg:col-span-6 lg:pt-4">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <LiveDemo onAccent={setPageAccent} />
          </motion.div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-quiet text-center sm:text-left">
            ↑ live demo · classification runs client-side, answers are seeded
          </p>
        </div>
      </div>
    </section>
  );
}
