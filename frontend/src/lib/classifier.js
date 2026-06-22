// Heuristic client-side classifier — instant, no network. Mirrors the backend keyword fallback.
const KEYWORDS = {
  finance: ["stock", "invest", "tax", "bank", "market", "budget", "money", "crypto", "loan", "fund", "etf", "ipo", "interest", "mortgage", "portfolio", "trading", "dividend", "bond", "savings", "retirement", "401k", "ira", "asset"],
  health: ["symptom", "disease", "doctor", "medicine", "diet", "exercise", "mental", "vitamin", "hospital", "drug", "therapy", "nutrition", "sleep", "anxiety", "fitness", "workout", "calorie", "protein", "weight", "anxious", "depression"],
  education: ["learn", "study", "course", "university", "concept", "explain", "history", "science", "math", "physics", "biology", "chemistry", "theorem", "essay", "calculus", "algebra", "philosophy", "literature", "grammar", "tradeoff", "algorithm", "newton"],
};

export function classifyClientSide(query) {
  const q = (query || "").toLowerCase();
  let best = "education";
  let bestScore = 0;
  for (const [v, kws] of Object.entries(KEYWORDS)) {
    const score = kws.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return { vertical: best, confidence: bestScore };
}

// Curated demo answers shown in the hero LiveDemo when no auth is available.
export const DEMO_ANSWERS = {
  "diversify": {
    vertical: "finance",
    title: "Portfolio Diversification",
    body: "Diversification reduces unsystematic risk without sacrificing expected return — the core insight of **Markowitz's mean-variance theory** (1952). A practical baseline: blend equities across geography (US, international, emerging), styles (large-cap, small-cap value), and sizes; add fixed income (treasuries, corporates) tuned to your horizon; consider real assets (REITs, commodities) for inflation hedging. Rebalance annually or on >5% drift. Asset *location* matters: hold tax-inefficient assets (bonds, REITs) in tax-deferred accounts; equities in taxable.",
    sources: [
      { id: "s1", title: "Portfolio Diversification Primer", content: "Modern portfolio theory (MPT), introduced by Harry Markowitz in 1952, argues that an investor can construct an 'efficient frontier' of optimal portfolios offering the maximum possible expected return for a given level of risk…", similarity: 0.89 },
      { id: "s2", title: "Portfolio Diversification Primer", content: "Periodic rebalancing (annually or when an asset drifts more than 5% from target) forces disciplined 'buy low, sell high' behavior. Tax-loss harvesting in taxable accounts can offset realized gains…", similarity: 0.81 },
    ],
  },
  "sleep": {
    vertical: "health",
    title: "Better Sleep, by the Evidence",
    body: "Adults need **7–9 hours**. Three high-leverage levers: (1) **Light** — morning sunlight within 30 minutes of waking anchors circadian rhythm; cut blue light 2h before bed. (2) **Temperature** — a 16–19 °C bedroom and a warm shower 90 min before bed (paradoxical cooling) help core temperature drop ~1 °C, which is required to fall asleep. (3) **Consistency** — same wake time daily; *sleep regularity* predicts metabolic health better than total duration. Caffeine has a 5–6h half-life — cut off by noon. CBT-I is first-line for chronic insomnia per AASM guidelines.",
    sources: [
      { id: "s1", title: "Evidence-Based Sleep Hygiene", content: "Morning sunlight (10–30 minutes within 30 minutes of waking) anchors circadian rhythm by suppressing melatonin and signaling the suprachiasmatic nucleus…", similarity: 0.91 },
      { id: "s2", title: "Evidence-Based Sleep Hygiene", content: "Core body temperature must drop ~1 °C to initiate sleep. Cool bedroom (16–19 °C / 60–67 °F), a warm shower 90 minutes before bed (paradoxical cooling), and breathable bedding all help…", similarity: 0.84 },
    ],
  },
  "bias-variance": {
    vertical: "education",
    title: "The Bias-Variance Tradeoff",
    body: "Total expected error decomposes into **irreducible noise + bias² + variance**. *Bias* is how far the model's average prediction deviates from truth — high-bias models *underfit* (e.g., a line fit to a quadratic). *Variance* is how much predictions shift across different training samples — high-variance models *overfit* (e.g., a deep tree that memorises). Visual: imagine darts. High bias → consistently off in one direction. High variance → scattered widely. Mitigations: reduce bias with richer features/models; reduce variance with regularisation (L1/L2), ensembles, more data, or early stopping.",
    sources: [
      { id: "s1", title: "Bias-Variance Tradeoff in ML", content: "The bias-variance tradeoff is a fundamental concept in supervised learning. Total expected prediction error decomposes into three components: irreducible error (noise inherent in the data), bias squared, and variance…", similarity: 0.93 },
      { id: "s2", title: "Bias-Variance Tradeoff in ML", content: "increasing model complexity (more parameters, deeper trees, more flexible kernels) generally reduces bias but increases variance. The optimal model minimizes total error, not bias alone or variance alone…", similarity: 0.86 },
    ],
  },
};
