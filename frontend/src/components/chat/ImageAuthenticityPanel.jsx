import {
  AlertTriangle,
  BadgeCheck,
  CircleHelp,
  ExternalLink,
  Fingerprint,
  ScanSearch,
  Sparkles,
} from "lucide-react";

const OUTCOMES = {
  likely_authentic: {
    label: "Likely authentic",
    icon: BadgeCheck,
    color: "#22C55E",
  },
  likely_ai_generated: {
    label: "Likely AI-generated",
    icon: Sparkles,
    color: "#A855F7",
  },
  possibly_manipulated: {
    label: "Possibly manipulated",
    icon: AlertTriangle,
    color: "#F59E0B",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    icon: CircleHelp,
    color: "#94A3B8",
  },
};

function SignalList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-tertiary">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-secondary">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ImageAuthenticityPanel({ assessment }) {
  if (!assessment) return null;
  const outcome =
    OUTCOMES[assessment.label] || OUTCOMES.insufficient_evidence;
  const Icon = outcome.icon;
  const metadata = assessment.metadata || {};
  const dimensions =
    metadata.width && metadata.height
      ? `${metadata.width} × ${metadata.height}`
      : "unavailable";
  const confidence = Math.round(
    Math.max(0, Math.min(1, assessment.confidence || 0)) * 100
  );

  return (
    <section
      className="w-full overflow-hidden rounded-lg border border-border bg-surface"
      aria-label="Image authenticity assessment"
      data-testid="image-authenticity-panel"
    >
      <div className="flex items-start gap-3 border-b border-border px-3 py-3 sm:px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
          style={{
            color: outcome.color,
            borderColor: `${outcome.color}45`,
            background: `${outcome.color}10`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-medium text-primary">{outcome.label}</h3>
            <span
              className="font-mono text-[10px]"
              style={{ color: outcome.color }}
            >
              {confidence}% confidence
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-secondary">
            {assessment.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-3 py-3 sm:grid-cols-2 sm:px-4">
        <SignalList title="Visual signals" items={assessment.visual_signals} />
        <SignalList
          title="Provenance signals"
          items={assessment.provenance_signals}
        />
      </div>

      <details className="border-t border-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs text-secondary hover:text-primary sm:px-4">
          <Fingerprint className="h-4 w-4" />
          <span>File metadata and method</span>
        </summary>
        <div className="grid gap-2 border-t border-border px-3 py-3 font-mono text-[10px] text-tertiary sm:grid-cols-2 sm:px-4">
          <span>format · {metadata.format || metadata.mime_type || "unknown"}</span>
          <span>dimensions · {dimensions}</span>
          <span>camera · {[metadata.camera_make, metadata.camera_model].filter(Boolean).join(" ") || "not recorded"}</span>
          <span>software · {metadata.software || "not recorded"}</span>
          <span>EXIF · {metadata.exif_present ? "present" : "not found"}</span>
          <span>
            Content Credentials ·{" "}
            {metadata.content_credentials_present ? "marker found" : "not found"}
          </span>
          <span className="sm:col-span-2">
            method · {assessment.method || "calibrated screening"}
          </span>
          <span className="sm:col-span-2">
            reverse-image search ·{" "}
            {assessment.reverse_search_performed
              ? "performed"
              : "not performed; source links below are text-based corroboration"}
          </span>
        </div>
      </details>

      {assessment.source_matches?.length > 0 && (
        <details className="border-t border-border">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs text-secondary hover:text-primary sm:px-4">
            <ScanSearch className="h-4 w-4" />
            <span>Source corroboration</span>
            <span className="ml-auto font-mono text-[9px] text-tertiary">
              {assessment.source_matches.length}
            </span>
          </summary>
          <div className="space-y-2 border-t border-border px-3 py-3 sm:px-4">
            {assessment.source_matches.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 text-xs text-secondary hover:text-primary"
              >
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate">{source.title}</span>
                  <span className="block truncate font-mono text-[9px] text-tertiary">
                    {source.url}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </details>
      )}

      <details className="border-t border-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs text-secondary hover:text-primary sm:px-4">
          <CircleHelp className="h-4 w-4" />
          <span>Limitations</span>
        </summary>
        <div className="border-t border-border px-3 py-3 sm:px-4">
          <SignalList title="Read before relying on this result" items={assessment.limitations} />
        </div>
      </details>
    </section>
  );
}
