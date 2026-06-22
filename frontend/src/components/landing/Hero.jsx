import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { motion } from "framer-motion";

export default function Hero({ ctaLoggedIn }) {
  const headingRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const orbRef = useRef(null);
  const tagRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(tagRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo(headingRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, "-=0.35")
        .fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.5")
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4");

      gsap.to(orbRef.current, {
        y: -24,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Subtle grid backdrop (mask fades it toward edges) */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Ambient orb — single deliberate light source */}
      <div
        ref={orbRef}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, #6366F114 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Eyebrow tag */}
      <div
        ref={tagRef}
        data-testid="landing-eyebrow"
        className="relative z-10 mb-7 flex items-center gap-2 px-3 py-1.5 rounded-full border border-finance/30 bg-finance/[0.04] text-finance text-[11px] font-mono"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-finance animate-pulse-slow" />
        RAG · Multi-domain · Claude Sonnet 4.6
      </div>

      {/* Main heading */}
      <h1
        ref={headingRef}
        className="relative z-10 font-display font-bold text-center leading-[0.95] tracking-tight text-5xl sm:text-7xl lg:text-8xl text-primary max-w-4xl"
      >
        Intelligence
        <br />
        <span
          className="text-transparent bg-clip-text"
          style={{ backgroundImage: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)" }}
        >
          on demand.
        </span>
      </h1>

      <p
        ref={subRef}
        className="relative z-10 mt-6 text-secondary text-base sm:text-lg text-center max-w-xl leading-relaxed"
      >
        Athena answers questions grounded in your documents — across Finance, Health,
        and Education — with full source citations in under 300&nbsp;ms.
      </p>

      <div ref={ctaRef} className="relative z-10 mt-10 flex items-center gap-3 flex-wrap justify-center">
        <Link
          to={ctaLoggedIn ? "/chat" : "/signup"}
          data-testid="landing-cta-primary"
          className="group inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-finance hover:bg-[#5254CC] text-white font-medium text-sm transition-all duration-200 shadow-glow-finance hover:shadow-none"
        >
          {ctaLoggedIn ? "Continue chatting" : "Start asking"}
          <motion.span
            className="inline-block"
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            →
          </motion.span>
        </Link>
        <Link
          to={ctaLoggedIn ? "/upload" : "/login"}
          data-testid="landing-cta-secondary"
          className="px-6 py-3 rounded-xl border border-border hover:border-muted text-secondary hover:text-primary text-sm transition-all duration-200"
        >
          Upload documents
        </Link>
      </div>

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none" />
    </section>
  );
}
