import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  CircleHelp,
  Eye,
  ExternalLink,
  Scale,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  YOUTUBE_SEEK_EVENT,
  youtubeUrlAtTime,
} from "../../lib/youtube";

const VERDICT_META = {
  supported: { color: "#22C55E", icon: CheckCircle2 },
  contradicted: { color: "#EF4444", icon: XCircle },
  misleading: { color: "#F59E0B", icon: AlertTriangle },
  unverified: { color: "#94A3B8", icon: CircleHelp },
};
const FILTERS = [
  { id: "all", label: "All" },
  { id: "moment", label: "Observations" },
  { id: "claim", label: "Claims" },
  { id: "issues", label: "Issues" },
];

export default function VideoTimeline({
  timeline = [],
  videoId,
  accent,
  credibility,
}) {
  const [filter, setFilter] = useState("all");
  const [expandedClaim, setExpandedClaim] = useState(null);
  const filteredTimeline = useMemo(
    () =>
      timeline.filter((item) => {
        if (filter === "all") return true;
        if (filter === "issues") {
          return (
            item.type === "claim" &&
            ["contradicted", "misleading"].includes(item.verdict)
          );
        }
        return item.type === filter;
      }),
    [filter, timeline]
  );

  if (!timeline.length) return null;

  return (
    <section
      className="w-full min-w-0 rounded-lg border border-border bg-surface/60 p-2.5 sm:p-3"
      aria-label="Video investigation timeline"
      data-testid="video-timeline"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">
          Investigation timeline
        </div>
        <div
          className="max-w-full overflow-x-auto rounded-md border border-border p-0.5"
          role="group"
          aria-label="Filter video timeline"
        >
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className="min-h-7 whitespace-nowrap rounded px-2 py-1 font-mono text-[9px] uppercase text-tertiary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={
                filter === option.id
                  ? { color: accent, background: `${accent}12` }
                  : {}
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {credibility && (
        <div
          className="mb-4 rounded-md border border-border bg-muted/10 p-3"
          data-testid="timeline-credibility"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-primary">
              <Scale className="h-3.5 w-3.5 text-tertiary" />
              {credibility.label}
            </span>
            {credibility.alignment_score !== null && (
              <span className="font-mono text-[10px] text-tertiary">
                {credibility.alignment_score}% evidence alignment
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-secondary">
            {credibility.summary}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-tertiary">
            <span>{credibility.counts?.supported || 0} supported</span>
            <span>{credibility.counts?.contradicted || 0} contradicted</span>
            <span>{credibility.counts?.misleading || 0} missing context</span>
            <span>{credibility.counts?.unverified || 0} unverified</span>
          </div>
        </div>
      )}
      <ol className="relative space-y-0">
        {filteredTimeline.map((item, index) => {
          const isClaim = item.type === "claim";
          const verdict = VERDICT_META[item.verdict] || VERDICT_META.unverified;
          const Icon = isClaim ? verdict.icon : Eye;
          const color = isClaim ? verdict.color : accent;
          return (
            <li
              key={item.id}
              className="relative grid min-w-0 grid-cols-[42px_16px_minmax(0,1fr)] gap-1.5 pb-4 last:pb-0 sm:grid-cols-[48px_18px_minmax(0,1fr)] sm:gap-2"
              data-testid={`timeline-item-${index}`}
              aria-label={`${item.type} at ${item.timestamp}: ${item.title}`}
            >
              <a
                href={youtubeUrlAtTime(videoId, item.timestamp_seconds)}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent(YOUTUBE_SEEK_EVENT, {
                      detail: {
                        videoId,
                        seconds: item.timestamp_seconds,
                      },
                    })
                  )
                }
                className="min-h-7 self-start rounded border border-border px-1 py-1 font-mono text-[9px] text-tertiary transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 sm:px-1.5 sm:text-[10px]"
                aria-label={`Open video at ${item.timestamp}`}
              >
                {item.timestamp}
              </a>
              <span className="relative flex justify-center">
                {index < filteredTimeline.length - 1 && (
                  <span className="absolute bottom-[-16px] top-4 w-px bg-border" />
                )}
                <span
                  className="relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border bg-surface"
                  style={{ borderColor: color, color }}
                >
                  <Icon className="h-2.5 w-2.5" />
                </span>
              </span>
              <div className="min-w-0 overflow-hidden pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-primary">
                    {item.title}
                  </span>
                  <span
                    className="font-mono text-[9px] uppercase"
                    style={{ color }}
                  >
                    {isClaim ? item.verdict : "observation"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  {item.description}
                </p>
                {isClaim && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedClaim((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                      aria-expanded={expandedClaim === item.id}
                      aria-controls={`evidence-${item.id}`}
                      className="inline-flex min-h-7 items-center gap-1.5 font-mono text-[10px] text-tertiary transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                    >
                      {item.evidence?.length || 0} evidence source
                      {item.evidence?.length === 1 ? "" : "s"}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          expandedClaim === item.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedClaim === item.id && (
                      <div
                        id={`evidence-${item.id}`}
                        className="mt-2 space-y-1.5"
                        data-testid={`timeline-evidence-${item.id}`}
                      >
                        {item.evidence?.length ? (
                          item.evidence.map((source) => {
                            const body = (
                              <>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[11px] text-primary">
                                    {source.title}
                                  </span>
                                  <span className="font-mono text-[9px] text-tertiary">
                                    {source.quality_label} ·{" "}
                                    {Math.round(source.quality_score * 100)}% quality
                                  </span>
                                </span>
                                {source.url && (
                                  <ExternalLink className="h-3 w-3 shrink-0 text-tertiary" />
                                )}
                              </>
                            );
                            return source.url ? (
                              <a
                                key={source.id}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-w-0 items-center gap-2 rounded border border-border px-2 py-1.5 transition-colors hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                              >
                                {body}
                              </a>
                            ) : (
                              <div
                                key={source.id}
                                className="flex items-center gap-2 rounded border border-border px-2 py-1.5"
                              >
                                {body}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[10px] text-tertiary">
                            No independent evidence was available.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {!filteredTimeline.length && (
        <p className="py-4 text-center text-xs text-tertiary">
          No timeline entries match this filter.
        </p>
      )}
      {credibility?.disclaimer && (
        <p className="mt-3 border-t border-border pt-2 text-[9px] leading-relaxed text-tertiary">
          {credibility.disclaimer}
        </p>
      )}
    </section>
  );
}
