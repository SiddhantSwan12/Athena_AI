import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Maximize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

let _mermaid = null;
let _diagId = 0;

function cleanDiagramCode(code) {
  return code
    .trim()
    .replace(/^```mermaid\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function getSvgDimensions(svg) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  const viewBox = (root.getAttribute("viewBox") || "")
    .split(/\s+/)
    .map(Number);
  const width =
    viewBox.length === 4 && Number.isFinite(viewBox[2])
      ? viewBox[2]
      : Number.parseFloat(root.getAttribute("width")) || 700;
  const height =
    viewBox.length === 4 && Number.isFinite(viewBox[3])
      ? viewBox[3]
      : Number.parseFloat(root.getAttribute("height")) || 500;

  return { width, height };
}

function withExportStyles(svg, accentColor) {
  const styles = `
    <style>
      .node rect,.node circle,.node ellipse,.node polygon,.node path {
        stroke:${accentColor} !important;
        stroke-width:1.25px !important;
      }
      .edgePath path { stroke:${accentColor} !important; }
      marker path { fill:${accentColor} !important; }
    </style>
  `;
  return svg.replace(/(<svg\b[^>]*>)/i, `$1${styles}`);
}

function svgToPngBlob(svg, width, height, accentColor) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const svgBlob = new Blob([withExportStyles(svg, accentColor)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const scale = Math.min(2, 2400 / Math.max(width, height, 1));

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG conversion failed"))),
        "image/png"
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Diagram image could not be prepared"));
    };
    image.src = url;
  });
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
  const [dimensions, setDimensions] = useState({ width: 700, height: 500 });
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const accentColor = accent || "#6B5BFF";
  const previewWidth = useMemo(
    () => Math.round(Math.min(1400, Math.max(560, dimensions.width))),
    [dimensions.width]
  );

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
        if (!cancelled) {
          setDimensions(getSvgDimensions(rendered));
          setSvg(rendered);
        }
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

  useEffect(() => {
    if (!isOpen) return undefined;
    const priorOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "+" || event.key === "=") {
        setZoom((value) => Math.min(3, value + 0.2));
      }
      if (event.key === "-") {
        setZoom((value) => Math.max(0.5, value - 0.2));
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = priorOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const openViewer = () => {
    setZoom(1);
    setIsOpen(true);
  };

  const copyImage = async () => {
    try {
      if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
        throw new Error("Image clipboard is unavailable");
      }
      const blob = await svgToPngBlob(
        svg,
        dimensions.width,
        dimensions.height,
        accentColor
      );
      await navigator.clipboard.write([
        new window.ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Diagram copied as an image");
    } catch {
      toast.error("This browser could not copy the diagram image");
    }
  };

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
    <>
      <div
        className="diagram-container group relative my-4 overflow-hidden rounded-xl border"
        style={{
          background: "#ffffff",
          borderColor: `${accentColor}30`,
          "--diagram-accent": accentColor,
        }}
      >
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={copyImage}
            aria-label="Copy diagram as image"
            title="Copy diagram as image"
            className="diagram-tool-button"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={openViewer}
            aria-label="Open enlarged diagram"
            title="Open enlarged diagram"
            className="diagram-tool-button"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={openViewer}
          className="block w-full cursor-zoom-in overflow-x-auto p-4 text-left"
          aria-label="Enlarge diagram"
          data-testid="mermaid-preview"
        >
          <div
            className="mermaid-svg"
            style={{ width: `${previewWidth}px` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged diagram"
            data-testid="mermaid-viewer"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/15 bg-black/55 px-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/65">
                Diagram viewer · {Math.round(zoom * 100)}%
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(0.5, value - 0.2))}
                  disabled={zoom <= 0.5}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="diagram-viewer-button"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                  title="Reset zoom"
                  className="diagram-viewer-button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.min(3, value + 0.2))}
                  disabled={zoom >= 3}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="diagram-viewer-button"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={copyImage}
                  aria-label="Copy diagram as image"
                  title="Copy diagram as image"
                  className="diagram-viewer-button"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close diagram viewer"
                  title="Close"
                  className="diagram-viewer-button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5 sm:p-8">
              <div
                className="mermaid-viewer-canvas mx-auto rounded-lg bg-white p-6 shadow-2xl"
                style={{
                  width: `${Math.max(560, dimensions.width) * zoom}px`,
                  minHeight: `${Math.max(400, dimensions.height) * zoom}px`,
                  "--diagram-accent": accentColor,
                }}
              >
                <div
                  className="mermaid-svg"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
