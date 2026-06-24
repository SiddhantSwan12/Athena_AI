import { useEffect, useState } from "react";

let _mermaid = null;
let _diagId = 0;

function cleanDiagramCode(code) {
  return code
    .trim()
    .replace(/^```mermaid\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

async function getMermaid() {
  if (!_mermaid) {
    const mod = await import("mermaid");
    _mermaid = mod.default;
    _mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "neutral",
      logLevel: "error",
      themeVariables: {
        fontFamily: "Inter Tight, Inter, system-ui, sans-serif",
        fontSize: "13px",
        primaryTextColor: "#111",
        secondaryTextColor: "#333",
        tertiaryTextColor: "#111",
        edgeLabelBackground: "#f5f5f5",
        lineColor: "#555",
      },
    });
  }
  return _mermaid;
}

export default function MermaidDiagram({ code, accent }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(null);
  const accentColor = accent || "#6B5BFF";

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++_diagId}`;
    const clean = cleanDiagramCode(code);
    const sandbox = document.createElement("div");
    sandbox.setAttribute("aria-hidden", "true");
    sandbox.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1000px;visibility:hidden;pointer-events:none;";
    document.body.appendChild(sandbox);

    setSvg("");
    setError(null);

    getMermaid()
      .then(async (m) => {
        const isValid = await m.parse(clean, { suppressErrors: true });
        if (!isValid) {
          throw new Error("Athena returned invalid Mermaid syntax");
        }
        return m.render(id, clean, sandbox);
      })
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Could not render diagram");
      })
      .finally(() => {
        sandbox.remove();
      });
    return () => {
      cancelled = true;
      sandbox.remove();
    };
  }, [code]);

  if (error) {
    return (
      <div
        className="my-3 rounded-lg border p-3"
        style={{
          color: accentColor,
          background: `${accentColor}08`,
          borderColor: `${accentColor}25`,
        }}
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em]">
          Diagram preview unavailable
        </p>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs text-secondary">
          {cleanDiagramCode(code)}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className="flex items-center gap-2 p-4 rounded-xl border my-3"
        style={{ borderColor: `${accentColor}30`, background: "rgba(0,0,0,0.04)" }}
      >
        <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
        <span className="text-xs font-mono" style={{ color: accentColor }}>rendering diagram…</span>
      </div>
    );
  }

  return (
    <div
      className="my-4 rounded-xl border overflow-x-auto diagram-container"
      style={{ background: "#ffffff", borderColor: `${accentColor}30` }}
    >
      <div
        className="p-4"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
