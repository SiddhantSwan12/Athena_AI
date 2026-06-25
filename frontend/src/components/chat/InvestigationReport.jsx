import {
  AlertTriangle,
  BadgeCheck,
  CircleHelp,
  ExternalLink,
  FileSearch,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

const RESULT_META = {
  claims_supported: {
    label: "Claims supported",
    color: "#22C55E",
    icon: BadgeCheck,
  },
  claims_contradicted: {
    label: "Claims contradicted",
    color: "#EF4444",
    icon: ShieldAlert,
  },
  mixed_or_misleading: {
    label: "Mixed or misleading",
    color: "#F59E0B",
    icon: AlertTriangle,
  },
  likely_authentic: {
    label: "Likely authentic",
    color: "#22C55E",
    icon: BadgeCheck,
  },
  likely_ai_generated: {
    label: "Likely AI-generated",
    color: "#A855F7",
    icon: ShieldAlert,
  },
  possibly_manipulated: {
    label: "Possibly manipulated",
    color: "#F59E0B",
    icon: AlertTriangle,
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    color: "#94A3B8",
    icon: CircleHelp,
  },
  informational: {
    label: "Investigation summary",
    color: "#38BDF8",
    icon: FileSearch,
  },
};

const VERDICT_COLORS = {
  supported: "#22C55E",
  contradicted: "#EF4444",
  misleading: "#F59E0B",
  unverified: "#94A3B8",
};

export default function InvestigationReport({ investigation }) {
  if (!investigation) return null;
  const meta =
    RESULT_META[investigation.overall_label] || RESULT_META.informational;
  const Icon = meta.icon;
  const confidence = Math.round(
    Math.max(0, Math.min(1, investigation.confidence || 0)) * 100
  );

  return (
    <section
      className="w-full overflow-hidden rounded-lg border border-border bg-surface"
      aria-label="Investigation report"
      data-testid="investigation-report"
    >
      <div className="flex items-start gap-3 border-b border-border px-3 py-3 sm:px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
          style={{
            color: meta.color,
            borderColor: `${meta.color}45`,
            background: `${meta.color}10`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-primary">{meta.label}</h3>
            {confidence > 0 && (
              <span className="font-mono text-[10px]" style={{ color: meta.color }}>
                {confidence}% confidence
              </span>
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-tertiary">
              {investigation.input_type}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-secondary">
            {investigation.summary}
          </p>
        </div>
      </div>

      {investigation.claims?.length > 0 && (
        <div className="border-b border-border px-3 py-3 sm:px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-tertiary">
            Checked claims
          </p>
          <div className="mt-2 space-y-2">
            {investigation.claims.map((claim, index) => {
              const color =
                VERDICT_COLORS[claim.verdict] || VERDICT_COLORS.unverified;
              return (
                <div key={claim.id || `${claim.claim}-${index}`} className="flex gap-2">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-primary">{claim.claim}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-secondary">
                      <span className="font-mono uppercase" style={{ color }}>
                        {claim.verdict || "unverified"}
                      </span>
                      {claim.explanation ? ` · ${claim.explanation}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <span className="font-mono text-[9px] text-tertiary">
          {investigation.evidence?.length || 0} evidence item(s)
        </span>
        <span className="font-mono text-[9px] text-tertiary">
          {investigation.limitations?.length || 0} limitation(s)
        </span>
        <Link
          to={`/investigations/${investigation.id}`}
          className="ml-auto flex items-center gap-1 text-xs text-secondary hover:text-primary"
          data-testid="open-investigation-report"
        >
          Open report
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
