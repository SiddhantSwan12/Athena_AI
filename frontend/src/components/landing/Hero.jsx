import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Link } from "react-router-dom";

import LiveDemo from "./LiveDemo";

export default function Hero({ ctaLoggedIn }) {
  const headlineRef = useRef(null);
  const subRef = useRef(null);
  const metaRef = useRef(null);
  const [pageAccent, setPageAccent] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(metaRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 })
        .fromTo(
          headlineRef.current?.querySelectorAll(".gsap-word") || [],
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.06 },
          "-=0.3"
        )
        .fromTo(subRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, "-=0.55");
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
            <span className="gsap-word inline-block">She</span>{" "}
            <span className="gsap-word inline-block">reads</span>
            <br />
            <span className="gsap-word inline-block">your</span>{" "}
            <em className="gsap-word italic font-medium inline-block" style={accentStyle}>library,</em>
            <br />
            <span className="gsap-word inline-block">and</span>{" "}
            <span className="gsap-word inline-block">answers</span>
            <br />
            <em className="gsap-word italic font-medium inline-block">like a scholar.</em>
          </h1>

          <p
            ref={subRef}
            className="mt-8 max-w-md text-secondary text-[1.05rem] leading-[1.75]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet mr-2">Athena</span>
            is a multi-domain oracle. Drop in your PDFs across
            <em className="italic"> finance</em>,<em className="italic"> health</em>, and
            <em className="italic"> education</em>, and ask anything — she routes,
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
