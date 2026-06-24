import { useEffect, useState } from "react";

let _mermaid = null;
let _diagId = 0;

async function getMermaid() {
  if (!_mermaid) {
    const mod = await import("mermaid");
    _mermaid = mod.default;
    _mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
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
    getMermaid()
      .then((m) => m.render(id, code.trim()))
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Could not render diagram");
      });
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre
        className="text-xs p-3 rounded-lg border overflow-x-auto my-3"
        style={{ color: "#cc3333", background: "rgba(255,0,0,0.04)", borderColor: "rgba(255,0,0,0.15)" }}
      >
        {code}
      </pre>
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
