import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/cn";
import { VERTICALS, accentClassFor } from "../lib/verticals";
import { ingestApi } from "../lib/api";

export default function DocumentUploader({ onUploaded }) {
  const [vertical, setVertical] = useState("finance");
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [tab, setTab] = useState("file"); // file | paste

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
    if (!title.trim()) {
      toast.error("Please provide a title for this document.");
      return;
    }
    setBusy(true);
    try {
      let res;
      if (tab === "file") {
        if (!file) { toast.error("Drop a PDF or TXT file first."); return; }
        res = await ingestApi.uploadFile(file, vertical, title.trim());
      } else {
        if (textContent.trim().length < 50) { toast.error("Paste at least 50 characters of content."); return; }
        res = await ingestApi.uploadText({ title: title.trim(), vertical, content: textContent });
      }
      toast.success(`Indexed "${res.title}" · ${res.chunks_inserted} chunks`);
      setFile(null);
      setTitle("");
      setTextContent("");
      onUploaded?.(res);
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("space-y-5", accentClassFor(vertical))} data-testid="document-uploader">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Vertical</p>
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((v) => (
            <button
              key={v.id}
              data-testid={`upload-vertical-${v.id}`}
              onClick={() => setVertical(v.id)}
              className={cn(
                accentClassFor(v.id),
                "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                vertical === v.id
                  ? "bg-white/[0.08] text-white border-accent shadow-accent"
                  : "border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Title</p>
        <input
          data-testid="upload-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 2025 Tax Planning Guide"
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-accent outline-none text-sm text-white placeholder:text-slate-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 p-1 rounded-xl glass w-fit">
        <button
          data-testid="upload-tab-file"
          onClick={() => setTab("file")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            tab === "file" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
          )}
        >
          File
        </button>
        <button
          data-testid="upload-tab-paste"
          onClick={() => setTab("paste")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            tab === "paste" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
          )}
        >
          Paste text
        </button>
      </div>

      {tab === "file" ? (
        <div
          {...getRootProps()}
          data-testid="upload-dropzone"
          className={cn(
            "rounded-2xl border-2 border-dashed transition-all cursor-pointer p-10 text-center",
            isDragActive
              ? "border-accent bg-[color:var(--accent-dim)]"
              : "border-white/20 hover:border-white/40 hover:bg-white/[0.02]"
          )}
        >
          <input {...getInputProps()} data-testid="upload-file-input" />
          {file ? (
            <div className="flex items-center justify-center gap-3 text-white">
              <FileText className="w-5 h-5 text-accent" />
              <span className="font-medium">{file.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="p-1 hover:bg-white/10 rounded-lg"
                data-testid="upload-file-clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">
                {isDragActive ? "Drop the file here" : "Drag & drop a PDF or .txt file"}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">or click to browse · PDF, TXT, MD</p>
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
          className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-accent outline-none text-sm text-slate-200 placeholder:text-slate-500 font-mono leading-relaxed"
        />
      )}

      <button
        data-testid="upload-submit-btn"
        onClick={submit}
        disabled={busy}
        className={cn(
          "w-full sm:w-auto px-6 py-3 rounded-xl bg-accent text-white font-medium transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-accent",
          busy && "opacity-60 cursor-not-allowed hover:translate-y-0"
        )}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Indexing…" : "Index document"}
      </button>
    </div>
  );
}
