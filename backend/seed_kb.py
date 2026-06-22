"""Seed sample knowledge base for each vertical."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from services.ingestion import ingest_document  # noqa: E402

SEED_USER = "seed-public"

DOCS = [
    {
        "vertical": "finance",
        "title": "Portfolio Diversification Primer",
        "content": """Modern portfolio theory (MPT), introduced by Harry Markowitz in 1952, argues that an investor can construct an "efficient frontier" of optimal portfolios offering the maximum possible expected return for a given level of risk. Diversification across uncorrelated assets reduces unsystematic (idiosyncratic) risk without sacrificing expected return.

Asset Classes: A well-diversified portfolio typically spans equities (US large-cap, US small-cap, international developed, emerging markets), fixed income (treasuries, investment-grade corporates, high-yield), real assets (REITs, commodities, infrastructure), and cash equivalents. The classic 60/40 stock-bond split is a starting baseline; tilts toward small-cap value, international, and factor exposures can improve risk-adjusted returns.

Rebalancing: Periodic rebalancing (annually or when an asset drifts more than 5% from target) forces disciplined "buy low, sell high" behavior. Tax-loss harvesting in taxable accounts can offset realized gains and up to $3,000 of ordinary income annually in the US.

Tax-Advantaged Accounts: Prioritize maxing 401(k) match, then HSA (triple tax advantage), then Roth IRA (post-tax growth), then traditional 401(k)/IRA. Asset location matters: hold tax-inefficient assets (bonds, REITs) in tax-deferred accounts; hold tax-efficient assets (broad-market equity ETFs) in taxable.

Common Pitfalls: Performance chasing, market timing, over-concentration in employer stock, ignoring fees (a 1% expense ratio compounds to ~28% of returns over 40 years). The data overwhelmingly favors low-cost passive index funds for the average investor.
""".strip(),
    },
    {
        "vertical": "finance",
        "title": "US Tax Basics for Individuals",
        "content": """The US federal income tax is progressive with marginal brackets ranging from 10% to 37% (2024). Your effective rate is typically much lower than your marginal rate because each bracket only applies to income within that range.

Standard vs Itemized: The standard deduction for 2024 is $14,600 (single) and $29,200 (married filing jointly). Itemize only if your eligible deductions — state and local taxes (capped at $10,000), mortgage interest, charitable contributions, medical expenses above 7.5% of AGI — exceed this.

Capital Gains: Assets held over one year qualify for long-term capital gains rates (0%, 15%, or 20% depending on income). Short-term gains are taxed as ordinary income. Wash sale rules prevent claiming a loss if you repurchase a substantially identical security within 30 days.

Retirement Accounts: 401(k) contributions are pre-tax (lowering current AGI), with 2024 limits at $23,000 ($30,500 if 50+). Roth contributions are after-tax but grow tax-free. HSAs allow pre-tax contributions, tax-free growth, and tax-free withdrawals for medical expenses — the only triple-tax-advantaged account.

Estimated Taxes: Self-employed individuals and those with significant non-W2 income must pay quarterly estimated taxes (April 15, June 15, September 15, January 15) to avoid underpayment penalties. Safe harbor: pay 100% of last year's tax (110% if AGI > $150k) or 90% of current year's tax.
""".strip(),
    },
    {
        "vertical": "health",
        "title": "Evidence-Based Sleep Hygiene",
        "content": """Adults aged 18-64 need 7-9 hours of sleep per night per the National Sleep Foundation. Chronic sleep deprivation is linked to cardiovascular disease, type 2 diabetes, depression, immune dysfunction, and increased all-cause mortality.

Light Exposure: Morning sunlight (10-30 minutes within 30 minutes of waking) anchors circadian rhythm by suppressing melatonin and signaling the suprachiasmatic nucleus. Conversely, blue-spectrum light after sunset (screens, LED bulbs) delays melatonin onset. Use warm-spectrum lighting and consider blue-light blocking glasses in the 2 hours before sleep.

Temperature: Core body temperature must drop ~1°C to initiate sleep. Cool bedroom (16-19°C / 60-67°F), a warm shower 90 minutes before bed (paradoxical cooling), and breathable bedding all help.

Caffeine: Half-life of 5-6 hours. A coffee at 2 PM still has half its dose active at 8 PM. Cut off by noon for sensitive sleepers. Caffeine blocks adenosine receptors, masking sleep pressure.

Alcohol: Initially sedating but fragments REM sleep and increases nocturnal awakenings. Avoid within 3 hours of bed.

Consistency: Wake at the same time every day (including weekends). Sleep duration variability is more predictive of metabolic dysfunction than total sleep time.

CBT-I: Cognitive Behavioral Therapy for Insomnia is the first-line treatment for chronic insomnia per AASM guidelines — more effective and durable than sleep medications.
""".strip(),
    },
    {
        "vertical": "health",
        "title": "Macronutrients and Body Composition",
        "content": """Energy balance is the primary driver of body composition: calories in vs calories out (CICO). However, macronutrient composition affects satiety, hormonal response, and adherence — which in turn drive long-term success.

Protein: 1.6-2.2 g/kg body weight per day is optimal for muscle protein synthesis and supports fat loss while preserving lean mass. Higher protein increases satiety (highest thermic effect of food, 20-30%) and reduces spontaneous calorie intake. Quality sources: lean meats, fish, eggs, dairy, legumes, tofu.

Carbohydrates: Primary fuel for high-intensity activity. The glycemic index/load matters less than total daily intake for most people. Fiber (25-38g/day) improves gut health, glycemic control, and satiety. Whole grains, fruits, vegetables, legumes are excellent sources.

Fats: 0.6-1.0 g/kg minimum to support hormone synthesis (testosterone, estrogen). Prioritize monounsaturated (olive oil, avocado, nuts) and omega-3 polyunsaturated (fatty fish, walnuts, flaxseed). Limit trans fats entirely; saturated fat is context-dependent.

Practical: Aim for 0.8-1.0 g protein per pound lean body mass, fill plate with non-starchy vegetables, time carbs around training, and ensure adequate fat for hormone health. Sustained 300-500 calorie daily deficit produces 0.5-1 lb fat loss per week without significant lean mass loss.
""".strip(),
    },
    {
        "vertical": "education",
        "title": "Bias-Variance Tradeoff in Machine Learning",
        "content": """The bias-variance tradeoff is a fundamental concept in supervised learning. Total expected prediction error decomposes into three components: irreducible error (noise inherent in the data), bias squared, and variance.

Bias measures how far a model's predictions deviate from the true relationship on average. High-bias models are too simple — they underfit. Example: fitting a straight line to data with a quadratic relationship. Linear regression has high bias on nonlinear problems.

Variance measures how much a model's predictions change when trained on different samples from the same distribution. High-variance models are too complex — they overfit. Example: a deep decision tree memorizes the training set but fails on new data.

Visual intuition: imagine throwing darts. High bias is missing the bullseye consistently in one direction. High variance is scattering darts widely around the bullseye. The goal is low bias AND low variance.

Trade-off: increasing model complexity (more parameters, deeper trees, more flexible kernels) generally reduces bias but increases variance. The optimal model minimizes total error, not bias alone or variance alone.

Mitigations:
- High bias: use a richer model, add features, reduce regularization.
- High variance: regularization (L1/L2), dropout, early stopping, more training data, ensembles (bagging, boosting), cross-validation for model selection.

Modern deep learning challenges this classic view: very large overparameterized networks can achieve low bias AND low variance ("double descent"), but the intuition still guides practical decisions.
""".strip(),
    },
    {
        "vertical": "education",
        "title": "Newton's Laws and Why They Matter",
        "content": """Isaac Newton published the Principia in 1687, formalizing three laws of motion that describe the relationship between forces and the motion of objects. They remain the foundation of classical mechanics — accurate for everyday speeds and scales, though replaced by relativity and quantum mechanics at extremes.

First Law (Inertia): An object at rest stays at rest, and an object in motion continues at constant velocity, unless acted on by a net external force. This overturned the Aristotelian view that motion required continuous force. The concept of "inertial reference frames" emerges from this.

Second Law (F = ma): Net force equals mass times acceleration. More precisely, force is the rate of change of momentum: F = dp/dt. For constant mass, this reduces to F = ma. This is the mathematical engine of mechanics — given forces, predict motion.

Third Law (Action-Reaction): For every action there is an equal and opposite reaction. Forces always come in pairs acting on different objects. A rocket pushes exhaust gas backward; the gas pushes the rocket forward. Walking works because your foot pushes the ground backward; the ground pushes you forward.

Conservation Laws: Newton's laws imply conservation of momentum (third law) and, with the work-energy theorem, conservation of energy. These are deeper symmetries (Noether's theorem links them to time/space translation invariance).

Where Newton breaks down: at speeds close to light (special relativity), in strong gravitational fields (general relativity), and at atomic scales (quantum mechanics). But for engineering on Earth, Newtonian mechanics is exact to many decimal places.
""".strip(),
    },
]


async def main():
    for d in DOCS:
        try:
            res = await ingest_document(
                content=d["content"],
                title=d["title"],
                vertical=d["vertical"],
                user_id=SEED_USER,
            )
            print(f"[OK] {d['vertical']:9s} · {d['title']} → {res['chunks_inserted']} chunks")
        except Exception as e:
            print(f"[ERR] {d['title']}: {type(e).__name__}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
