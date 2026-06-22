import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACCENT_MAP } from "../../lib/VerticalContext";
import { classifyClientSide, DEMO_ANSWERS } from "../../lib/classifier";

const SAMPLES = [
  { id: "diversify",     query: "How do I diversify a stock portfolio?",          vertical: "finance" },
  { id: "sleep",         query: "What helps me sleep better long-term?",          vertical: "health" },
  { id: "bias-variance", query: "Explain the bias-variance tradeoff.",            vertical: "education" },
];

const TICKER_LABELS = ["FINANCE", "HEALTH", "EDUCATION"];

// State machine: idle → classifying → resolving → answering → done
export default function LiveDemo({ onAccent }) {
  const [input, setInput] = useState("");
  const [state, setState] = useState("idle"); // idle | classifying | resolving | answering | done
  const [resolved, setResolved] = useState(null); // {vertical, title, body, sources}
  const [tickerIdx, setTickerIdx] = useState(0);
  const [streamed, setStreamed] = useState("");
  const [showSources, setShowSources] = useState(false);
  const streamTimer = useRef(null);
  const tickerTimer = useRef(null);

  const accent = resolved ? ACCENT_MAP[resolved.vertical].accent : "#6B5BFF";

  useEffect(() => {
    onAccent?.(resolved?.vertical || null);
  }, [resolved, onAccent]);

  // Cleanup
  useEffect(() => () => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    if (tickerTimer.current) clearInterval(tickerTimer.current);
  }, []);

  const resetDemo = useCallback(() => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    if (tickerTimer.current) clearInterval(tickerTimer.current);
    setState("idle");
    setResolved(null);
    setStreamed("");
    setShowSources(false);
  }, []);

  const runDemo = useCallback((sampleId, queryOverride) => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    if (tickerTimer.current) clearInterval(tickerTimer.current);

    const sample = SAMPLES.find((s) => s.id === sampleId) || SAMPLES[0];
    const query = (queryOverride || sample.query).trim();
    if (!query) return;
    setInput(query);
    const data = DEMO_ANSWERS[sample.id] || DEMO_ANSWERS["bias-variance"];
    const guessed = queryOverride ? classifyClientSide(queryOverride).vertical : sample.vertical;

    setState("classifying");
    setResolved(null);
    setStreamed("");
    setShowSources(false);
    setTickerIdx(0);

    // Cycle the ticker fast for ~1200ms, then resolve
    let i = 0;
    tickerTimer.current = setInterval(() => {
      i += 1;
      setTickerIdx(i % TICKER_LABELS.length);
    }, 75);

    setTimeout(() => {
      clearInterval(tickerTimer.current);
      const targetIdx = TICKER_LABELS.indexOf(guessed.toUpperCase());
      setTickerIdx(targetIdx >= 0 ? targetIdx : 0);
      setState("resolving");
      setResolved({ ...data, vertical: guessed });

      // Brief pause for "snap to answer" feel, then start streaming
      setTimeout(() => {
        setState("answering");
        let pos = 0;
        const body = data.body;
        streamTimer.current = setInterval(() => {
          pos += Math.max(2, Math.floor(Math.random() * 6) + 1);
          setStreamed(body.slice(0, pos));
          if (pos >= body.length) {
            clearInterval(streamTimer.current);
            setState("done");
            setTimeout(() => setShowSources(true), 350);
          }
        }, 18);
      }, 280);
    }, 1100);
  }, []);

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (state === "answering" || state === "done") return;
      // If user typed something, use it; else default to first sample
      if (input.trim()) {
        // Try to match closest sample by keyword
        const guess = classifyClientSide(input).vertical;
        const fallback = SAMPLES.find((s) => s.vertical === guess) || SAMPLES[0];
        runDemo(fallback.id, input);
      } else {
        runDemo(SAMPLES[0].id);
      }
    }
  };

  // Tiny markdown bolds rendering (just **bold**)
  const renderInline = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-primary font-semibold">{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <div
      data-testid="live-demo"
      data-vertical={resolved?.vertical || "auto"}
      className="relative w-full"
      style={{ "--accent": accent }}
    >
      {/* Terminal frame */}
      <div className="relative rounded-2xl border border-border bg-paper paper-noise overflow-hidden">
        {/* HUD top strip */}
        <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b border-border/80 font-mono text-[10px] uppercase tracking-[0.22em] text-tertiary">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <span className="text-secondary">athena</span>
            <span>·</span>
            <span>oracle terminal</span>
          </div>
          <div className="flex items-center gap-3 tabular">
            <span>v1.1.0</span>
            <span className="text-quiet">/</span>
            <span>{state === "idle" ? "ready" : state === "classifying" ? "routing" : state === "answering" ? "streaming" : state === "done" ? "complete" : "resolving"}</span>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 p-5 sm:p-7">
          {/* Query input */}
          <div className="flex items-start gap-3">
            <span className="font-mono text-[11px] mt-2 tabular" style={{ color: accent }}>{"q ▸"}</span>
            <textarea
              data-testid="demo-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={2}
              placeholder="Ask anything across Finance, Health, or Education…"
              className="flex-1 bg-transparent resize-none outline-none font-display italic text-lg sm:text-xl text-primary placeholder:text-quiet placeholder:italic leading-snug"
            />
            <button
              data-testid="demo-reset"
              onClick={resetDemo}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-quiet hover:text-secondary transition-colors mt-2"
              title="Reset demo"
            >
              {state === "idle" ? "" : "reset"}
            </button>
          </div>

          {/* Sample chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet">try</span>
            {SAMPLES.map((s) => {
              const c = ACCENT_MAP[s.vertical].accent;
              const active = resolved?.vertical === s.vertical && state !== "idle";
              return (
                <button
                  key={s.id}
                  data-testid={`demo-sample-${s.id}`}
                  onClick={() => runDemo(s.id)}
                  disabled={state === "classifying" || state === "answering"}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[11px] transition-all disabled:opacity-60"
                  style={{
                    borderColor: active ? `${c}80` : "#231F25",
                    color: active ? c : "#9C95A0",
                    background: active ? `${c}10` : "transparent",
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: c }} />
                  {s.query.length > 40 ? s.query.slice(0, 40) + "…" : s.query}
                </button>
              );
            })}
          </div>

          <div className="my-6 editorial-rule" />

          {/* Classifier line — always visible after idle */}
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-tertiary flex items-center gap-3 tabular min-h-[16px]">
            <span>route</span>
            <span className="text-quiet">›</span>
            <AnimatePresence mode="popLayout">
              {state === "idle" ? (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-quiet">
                  awaiting query
                </motion.span>
              ) : (
                <motion.span
                  key={`ticker-${tickerIdx}-${state}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  style={{ color: resolved && (state === "answering" || state === "done" || state === "resolving") ? accent : "#9C95A0" }}
                >
                  {TICKER_LABELS[tickerIdx]}
                </motion.span>
              )}
            </AnimatePresence>
            {(state === "resolving" || state === "answering" || state === "done") && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-quiet flex items-center gap-2 ml-auto">
                <span>auto-routed</span>
                <span className="w-1 h-1 rounded-full" style={{ background: accent }} />
              </motion.span>
            )}
          </div>

          {/* Answer column */}
          <AnimatePresence>
            {resolved && (state === "answering" || state === "done" || state === "resolving") && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6"
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="marker">grounded answer</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] tabular" style={{ color: accent }}>
                    {resolved.vertical}
                  </span>
                </div>
                <h3 className="font-display italic text-2xl sm:text-3xl text-primary tracking-tight mb-3">
                  {resolved.title}
                </h3>
                <p className="text-secondary text-[0.95rem] leading-[1.7]">
                  {renderInline(streamed)}
                  {state === "answering" && (
                    <span className="inline-block w-[8px] h-[1.05em] align-middle ml-0.5 animate-blink" style={{ background: accent }} />
                  )}
                </p>

                {/* Source citations */}
                <AnimatePresence>
                  {showSources && resolved.sources && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45 }}
                      className="mt-6"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="marker">sources · {resolved.sources.length}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {resolved.sources.map((s, i) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.08 }}
                            className="px-3 py-2.5 rounded-lg border text-[11px] font-mono"
                            style={{ borderColor: `${accent}30`, background: `${accent}06` }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span style={{ color: accent }}>
                                chunk_{i + 1}
                                <span className="text-quiet"> · {s.title}</span>
                              </span>
                              <span className="text-tertiary tabular">{(s.similarity * 100).toFixed(0)}% match</span>
                            </div>
                            <p className="text-tertiary leading-relaxed line-clamp-3">{s.content}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle hint */}
          {state === "idle" && (
            <p className="mt-6 font-mono text-[11px] text-quiet">
              press <span className="text-secondary">enter</span> to run · or pick a sample above ↑
            </p>
          )}
        </div>

        {/* HUD bottom strip */}
        <div className="relative z-10 px-4 py-2 border-t border-border/80 font-mono text-[10px] uppercase tracking-[0.22em] text-quiet flex items-center justify-between tabular">
          <span>claude-sonnet-4-6 · gemini-embedding-001</span>
          <span>3072d · cosine</span>
        </div>

        {/* Subtle scanlines overlay */}
        <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />
      </div>
    </div>
  );
}
