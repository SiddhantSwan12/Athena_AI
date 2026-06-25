import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Scale,
  XCircle,
} from "lucide-react";

import { YOUTUBE_SEEK_EVENT } from "../../lib/youtube";

const VERDICT_STYLES = {
  supported: {
    label: "Supported",
    color: "#22C55E",
    icon: CheckCircle2,
  },
  contradicted: {
    label: "Contradicted",
    color: "#EF4444",
    icon: XCircle,
  },
  misleading: {
    label: "Missing context",
    color: "#F59E0B",
    icon: AlertTriangle,
  },
  unverified: {
    label: "Unverified",
    color: "#94A3B8",
    icon: CircleHelp,
  },
};

export default function FactCheckPanel({
  factChecks = [],
  videoId,
  credibility,
}) {
  if (!factChecks.length) return null;

  return (
    <section
      className="w-full border-t border-border pt-3"
      aria-label="Fact-check results"
      data-testid="fact-check-panel"
    >
      <div className="mb-3 flex items-center gap-2">
        <Scale className="h-4 w-4 text-tertiary" />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">
          Claim verification
        </h3>
      </div>
      {credibility && (
        <div
          className="mb-3 border-b border-border pb-3"
          data-testid="credibility-summary"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-primary">
              {credibility.label}
            </span>
            {credibility.alignment_score !== null && (
              <span className="font-mono text-xs text-tertiary">
                {credibility.alignment_score}% evidence alignment
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-secondary">
            {credibility.summary}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-tertiary">
            <span>{credibility.counts?.supported || 0} supported</span>
            <span>{credibility.counts?.contradicted || 0} contradicted</span>
            <span>{credibility.counts?.misleading || 0} missing context</span>
            <span>{credibility.counts?.unverified || 0} unverified</span>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {factChecks.map((check, index) => {
          const style =
            VERDICT_STYLES[check.verdict] || VERDICT_STYLES.unverified;
          const Icon = style.icon;
          return (
            <details
              key={check.id || `${check.timestamp_seconds}-${index}`}
              className="rounded-lg border border-border bg-surface/70"
              data-testid={`fact-check-${index}`}
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 p-3">
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: style.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-primary">
                    {check.claim}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span style={{ color: style.color }}>{style.label}</span>
                    <span className="text-tertiary">
                      {Math.round(Number(check.confidence || 0) * 100)}% confidence
                    </span>
                    <span className="text-tertiary">
                      {check.independent_sources || 0} independent source
                      {check.independent_sources === 1 ? "" : "s"}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    window.dispatchEvent(
                      new CustomEvent(YOUTUBE_SEEK_EVENT, {
                        detail: {
                          videoId,
                          seconds: check.timestamp_seconds,
                        },
                      })
                    );
                  }}
                  className="shrink-0 rounded border border-border px-2 py-1 font-mono text-[10px] text-tertiary transition-colors hover:text-primary"
                  aria-label={`Play video at ${check.timestamp}`}
                >
                  {check.timestamp}
                </button>
              </summary>
              <div className="border-t border-border px-3 pb-3 pt-2">
                <p className="text-xs leading-relaxed text-secondary">
                  {check.explanation}
                </p>
                {check.evidence?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {check.evidence.map((source) => {
                      const content = (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs text-primary">
                              {source.title}
                            </span>
                            <span className="font-mono text-[9px] text-tertiary">
                              {source.quality_label} ·{" "}
                              {Math.round(source.quality_score * 100)}% quality
                            </span>
                          </span>
                          {source.url && (
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-tertiary" />
                          )}
                        </>
                      );
                      return source.url ? (
                        <a
                          key={source.id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 transition-colors hover:bg-muted/20"
                        >
                          {content}
                        </a>
                      ) : (
                        <div
                          key={source.id}
                          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2"
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-tertiary">
        {credibility?.disclaimer ||
          "Verdicts reflect available evidence and may change as new information appears."}
      </p>
    </section>
  );
}
