import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useVertical, ACCENT_MAP, VERTICAL_META } from "../lib/VerticalContext";
import { ingestApi } from "../lib/api";

export default function DocumentUploader({ onUploaded }) {
  const { vertical: ctxVertical, setVertical } = useVertical();
  const [vertical, setLocal] = useState(ctxVertical || "finance");
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [tab, setTab] = useState("file");

  const a = ACCENT_MAP[vertical].accent;

  const onDrop = useCallback((accepted) => {
    if (!accepted?.length) return;
    const f = accepted[0];
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
  });

  const submit = async () => {
    if (busy) return;
    if (!title.trim()) { toast.error("Please provide a title."); return; }
    setBusy(true);
    try {
      let res;
      if (tab === "file") {
        if (!file) { toast.error("Drop a PDF or TXT file first."); return; }
        res = await ingestApi.uploadFile(file, vertical, title.trim());
      } else {
        if (textContent.trim().length < 50) { toast.error("Paste at least 50 characters."); return; }
        res = await ingestApi.uploadText({ title: title.trim(), vertical, content: textContent });
      }
      toast.success(`Indexed "${res.title}" · ${res.chunks_inserted} chunks`);
      setFile(null); setTitle(""); setTextContent("");
      setVertical(vertical);
      onUploaded?.(res);
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="document-uploader">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-tertiary font-mono mb-2.5">Vertical</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(VERTICAL_META).map(([id, v]) => {
            const va = ACCENT_MAP[id].accent;
            const active = vertical === id;
            return (
              <button
                key={id}
                data-testid={`upload-vertical-${id}`}
                onClick={() => setLocal(id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                  active ? "text-primary" : "text-tertiary border-border hover:text-secondary"
                }`}
                style={
                  active
                    ? { background: `${va}15`, borderColor: `${va}55`, boxShadow: `0 0 16px 0 ${va}20` }
                    : {}
                }
              >
                <span className="mr-1.5">{v.icon}</span>{v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-tertiary font-mono mb-2.5">Title</p>
        <input
          data-testid="upload-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 2025 Tax Planning Guide"
          className="w-full px-4 py-2.5 rounded-xl bg-void border border-border focus:border-muted outline-none text-sm text-primary placeholder:text-tertiary transition-colors"
        />
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface border border-border w-fit">
        <button
          data-testid="upload-tab-file"
          onClick={() => setTab("file")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === "file" ? "bg-void text-primary" : "text-tertiary hover:text-secondary"}`}
        >
          File
        </button>
        <button
          data-testid="upload-tab-paste"
          onClick={() => setTab("paste")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === "paste" ? "bg-void text-primary" : "text-tertiary hover:text-secondary"}`}
        >
          Paste text
        </button>
      </div>

      {tab === "file" ? (
        <div
          {...getRootProps()}
          data-testid="upload-dropzone"
          className="rounded-2xl border-2 border-dashed transition-all cursor-pointer p-12 text-center"
          style={{
            borderColor: isDragActive ? a : "#1F2937",
            background: isDragActive ? `${a}08` : "transparent",
          }}
        >
          <input {...getInputProps()} data-testid="upload-file-input" />
          {file ? (
            <div className="flex items-center justify-center gap-3 text-primary">
              <FileText className="w-5 h-5" style={{ color: a }} />
              <span className="font-medium text-sm">{file.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="p-1 hover:bg-border rounded-lg text-tertiary hover:text-primary"
                data-testid="upload-file-clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-7 h-7 text-tertiary mx-auto mb-3" />
              <p className="text-secondary font-medium text-sm">
                {isDragActive ? "Drop the file here" : "Drag & drop a PDF or .txt file"}
              </p>
              <p className="text-[11px] text-tertiary mt-1.5 font-mono">or click to browse · PDF · TXT · MD</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          data-testid="upload-text-area"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste raw text content here (notes, articles, research…)"
          rows={10}
          className="w-full px-4 py-3 rounded-2xl bg-void border border-border focus:border-muted outline-none text-sm text-secondary placeholder:text-tertiary font-mono leading-relaxed transition-colors"
        />
      )}

      <button
        data-testid="upload-submit-btn"
        onClick={submit}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
        style={{ background: a, boxShadow: `0 0 24px 0 ${a}30` }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Indexing…" : "Index document"}
      </button>
    </div>
  );
}
