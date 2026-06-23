import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    label: "Upload",
    title: "Ingest",
    body: "PDF · TXT · MD chunked into ~900-char overlapping passages.",
    sub: "RecursiveCharacterTextSplitter",
    arrow: true,
  },
  {
    n: "02",
    label: "Embed",
    title: "Vectorise",
    body: "Each chunk → 3072-dim vector via Gemini embedding-001.",
    sub: "gemini-embedding-001",
    arrow: true,
  },
  {
    n: "03",
    label: "Route",
    title: "Classify",
    body: "Your query is auto-routed to Finance, Health, or Education.",
    sub: "gemini-2.5-flash",
    arrow: true,
  },
  {
    n: "04",
    label: "Retrieve",
    title: "Search",
    body: "Cosine similarity over the matching vertical · top-5 chunks.",
    sub: "k=5 · τ=0.55",
    arrow: true,
  },
  {
    n: "05",
    label: "Answer",
    title: "Ground",
    body: "Claude composes a cited answer using only retrieved passages.",
    sub: "claude-sonnet-4-6",
    arrow: false,
  },
];

export default function Schematic() {
  return (
    <section
      data-testid="schematic"
      className="relative px-6 py-24 sm:py-32 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4">
          <p className="marker">§ The Pipeline</p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl text-primary leading-[0.95] tracking-tight">
            How the oracle{" "}
            <em className="italic font-medium">arrives</em>{" "}
            <br className="hidden sm:block" />
            at <em className="italic font-medium" style={{ color: "#6B5BFF" }}>knowing</em>.
          </h2>
          <p className="mt-6 max-w-md text-secondary text-[1rem] leading-[1.7]">
            Five deterministic stages between your question and a cited answer.
            No hidden reasoning, no hallucinated sources — just retrieval over
            <em className="italic"> your </em>library.
          </p>
        </div>

        <div className="lg:col-span-8">
          <ol className="relative space-y-3">
            <motion.div
              aria-hidden
              className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-finance/70 to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "left" }}
            />
            {STEPS.map((step, i) => (
              <motion.li
                key={step.n}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="grid grid-cols-12 gap-3 sm:gap-5 items-start py-4 border-t border-border">
                  <div className="col-span-2 sm:col-span-1 marker tabular pt-1">
                    <motion.span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border bg-paper"
                      whileInView={{
                        borderColor: ["#231F25", "#6B5BFF", "#231F25"],
                        color: ["#5D5560", "#F4EFE7", "#5D5560"],
                      }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 1.4, delay: 0.2 + i * 0.18 }}
                    >
                      {step.n}
                    </motion.span>
                  </div>
                  <div className="col-span-10 sm:col-span-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet">{step.label}</p>
                    <p className="font-display italic text-2xl text-primary tracking-tight mt-1">{step.title}</p>
                  </div>
                  <div className="col-span-12 sm:col-span-5 sm:pt-1">
                    <p className="text-secondary text-sm leading-relaxed">{step.body}</p>
                  </div>
                  <div className="col-span-12 sm:col-span-3 sm:pt-1 text-left sm:text-right">
                    <motion.span
                      className="inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-quiet px-2 py-1 rounded border border-border bg-paper/40 tabular"
                      whileInView={{ opacity: [0.45, 1, 0.7] }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.8, delay: 0.25 + i * 0.1 }}
                    >
                      {step.sub}
                    </motion.span>
                  </div>
                </div>
                {step.arrow && (
                  <motion.div
                    aria-hidden
                    className="ml-0 sm:ml-7 h-3 w-px bg-gradient-to-b from-finance/70 to-transparent"
                    initial={{ scaleY: 0, opacity: 0 }}
                    whileInView={{ scaleY: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.35, delay: 0.25 + i * 0.08 }}
                    style={{ transformOrigin: "top" }}
                  />
                )}
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
