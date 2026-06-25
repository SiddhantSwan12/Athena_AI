import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileSearch,
  Printer,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import TopBar from "../components/layout/TopBar";
import { convosApi } from "../lib/api";

const RESULT_LABELS = {
  claims_supported: "Claims supported",
  claims_contradicted: "Claims contradicted",
  mixed_or_misleading: "Mixed or misleading",
  likely_authentic: "Likely authentic",
  likely_ai_generated: "Likely AI-generated",
  possibly_manipulated: "Possibly manipulated",
  insufficient_evidence: "Insufficient evidence",
  informational: "Investigation summary",
};

const RESULT_COLORS = {
  claims_supported: "#22C55E",
  claims_contradicted: "#EF4444",
  mixed_or_misleading: "#F59E0B",
  likely_authentic: "#22C55E",
  likely_ai_generated: "#A855F7",
  possibly_manipulated: "#F59E0B",
  insufficient_evidence: "#94A3B8",
  informational: "#38BDF8",
};

function ReportDetails({ report }) {
  const [copied, setCopied] = useState(false);
  const color = RESULT_COLORS[report.overall_label] || RESULT_COLORS.informational;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Report link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy the report link");
    }
  };

  return (
    <article className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 print:max-w-none print:px-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          to="/investigations"
          className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All reports
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs text-secondary hover:text-primary"
            data-testid="copy-investigation-link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs text-secondary hover:text-primary"
            data-testid="print-investigation"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      <header className="border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-tertiary">
          Athena investigation · {report.input_type}
        </p>
        <h1 className="mt-3 font-display text-3xl text-primary sm:text-5xl">
          {report.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium" style={{ color }}>
            {RESULT_LABELS[report.overall_label] || report.overall_label}
          </span>
          {report.confidence > 0 && (
            <span className="font-mono text-xs text-tertiary">
              {Math.round(report.confidence * 100)}% confidence
            </span>
          )}
          <span className="font-mono text-xs text-tertiary">
            {new Date(report.created_at).toLocaleString()}
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary">
          {report.summary}
        </p>
      </header>

      {report.claims?.length > 0 && (
        <section className="border-b border-border py-6">
          <h2 className="text-lg font-medium text-primary">Checked claims</h2>
          <div className="mt-4 space-y-4">
            {report.claims.map((claim, index) => (
              <div key={claim.id || index}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase text-tertiary">
                    {claim.timestamp && claim.timestamp !== "00:00"
                      ? claim.timestamp
                      : `Claim ${index + 1}`}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-primary">
                    {claim.verdict || "unverified"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-primary">{claim.claim}</p>
                <p className="mt-1 text-sm leading-6 text-secondary">
                  {claim.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.evidence?.length > 0 && (
        <section className="border-b border-border py-6">
          <h2 className="text-lg font-medium text-primary">Evidence</h2>
          <div className="mt-3 space-y-2">
            {report.evidence.map((item, index) =>
              item.url ? (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-secondary hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {item.title}
                </a>
              ) : (
                <p key={`${item.title}-${index}`} className="text-sm text-secondary">
                  {item.title}
                </p>
              )
            )}
          </div>
        </section>
      )}

      {report.limitations?.length > 0 && (
        <section className="py-6">
          <h2 className="text-lg font-medium text-primary">Limitations</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary">
            {report.limitations.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function InvestigationsPage() {
  const { investigationId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const request = investigationId
      ? convosApi.getInvestigation(investigationId)
      : convosApi.listInvestigations();
    request
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => toast.error("Could not load investigations"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [investigationId]);

  return (
    <div className="min-h-screen bg-void text-primary">
      <div className="print:hidden">
        <TopBar showSwitcher={false} />
      </div>
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center font-mono text-xs text-tertiary">
          Loading investigations…
        </div>
      ) : investigationId && data ? (
        <ReportDetails report={data} />
      ) : (
        <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
          <div className="flex items-center gap-3">
            <FileSearch className="h-5 w-5 text-tertiary" />
            <h1 className="font-display text-3xl text-primary">Investigations</h1>
          </div>
          <div className="mt-7 divide-y divide-border border-y border-border">
            {(data || []).map((report) => (
              <Link
                key={report.id}
                to={`/investigations/${report.id}`}
                className="grid gap-2 py-4 hover:bg-surface/40 sm:grid-cols-[1fr_auto] sm:px-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-primary">{report.title}</p>
                  <p className="mt-1 text-xs text-secondary">{report.summary}</p>
                </div>
                <div className="font-mono text-[10px] uppercase text-tertiary">
                  {RESULT_LABELS[report.overall_label] || report.overall_label}
                </div>
              </Link>
            ))}
            {!data?.length && (
              <p className="py-10 text-center text-sm text-tertiary">
                No investigations saved yet.
              </p>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
