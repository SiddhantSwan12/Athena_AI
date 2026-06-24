import { useEffect, useState } from "react";

let _mermaid = null;
let _diagId = 0;

async function getMermaid() {
  if (!_mermaid) {
    const mod = await import("mermaid");
    _mermaid = mod.default;
    _mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#1e1b2e",
        primaryTextColor: "#E8E2DA",
        primaryBorderColor: "#6B5BFF",
        lineColor: "#6B5BFF80",
        secondaryColor: "#13111a",
        tertiaryColor: "#0d0b14",
        background: "#070608",
        mainBkg: "#1a1726",
        nodeBorder: "#6B5BFF",
        clusterBkg: "#1a1726",
        titleColor: "#F4EFE7",
        edgeLabelBackground: "#13111a",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "13px",
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
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre
        className="text-xs p-3 rounded-lg border overflow-x-auto my-3"
        style={{ color: "#ff6b6b", background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,107,107,0.2)" }}
      >
        {code}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div
        className="flex items-center gap-2 p-4 rounded-xl border my-3"
        style={{ borderColor: `${accentColor}30`, background: "rgba(0,0,0,0.25)" }}
      >
        <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
        <span className="text-xs font-mono" style={{ color: accentColor }}>
          rendering diagram…
        </span>
      </div>
    );
  }

  return (
    <div
      className="my-4 p-4 rounded-xl border overflow-x-auto diagram-container"
      style={{ background: "rgba(0,0,0,0.28)", borderColor: `${accentColor}28` }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
