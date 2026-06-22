import { useEffect, useState } from "react";
import { Trash2, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import TopBar from "../components/layout/TopBar";
import { ingestApi } from "../lib/api";
import { ACCENT_MAP, VERTICAL_META, labelFor } from "../lib/VerticalContext";

export default function LibraryPage() {
  const nav = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = () => {
    setLoading(true);
    ingestApi.listDocuments().then(setDocs).catch(() => setDocs([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const onDelete = async (id) => {
    try {
      await ingestApi.deleteDocument(id);
      toast.success("Document removed");
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error("Couldn't delete document");
    }
  };

  const grouped = docs.reduce((acc, d) => { (acc[d.vertical] = acc[d.vertical] || []).push(d); return acc; }, {});

  return (
    <div className="min-h-screen flex flex-col bg-void text-primary">
      <TopBar showSwitcher={false} />
      <main className="flex-1 overflow-y-auto" data-testid="library-page">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-tertiary">Athena · Library</p>
              <h1 className="mt-2 font-display font-bold text-4xl text-primary tracking-tight">Documents</h1>
              <p className="mt-2 text-sm text-secondary">
                Your indexed knowledge base · {docs.length} document{docs.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              onClick={() => nav("/upload")}
              data-testid="library-add-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-finance hover:bg-[#5254CC] text-white font-medium text-xs transition-all hover:-translate-y-0.5 shadow-glow-finance"
            >
              <Plus className="w-3.5 h-3.5" /> Index document
            </button>
          </div>

          {loading ? (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-surface/50 animate-pulse" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="mt-16 text-center py-16 rounded-2xl bg-surface/50 border border-border">
              <FileText className="w-9 h-9 text-tertiary mx-auto mb-4" />
              <p className="text-secondary font-medium text-sm">Your library is empty</p>
              <p className="text-[11px] text-tertiary mt-1.5 font-mono">Upload a PDF or paste text to get started.</p>
              <button
                onClick={() => nav("/upload")}
                className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-border border border-border text-xs font-medium transition-all"
                data-testid="library-empty-upload-btn"
              >
                Upload your first <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="mt-10 space-y-10">
              {Object.keys(VERTICAL_META).map((v) =>
                grouped[v]?.length ? (
                  <section key={v}>
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="text-[10px] uppercase tracking-[0.22em] font-mono"
                        style={{ color: ACCENT_MAP[v].accent }}
                      >
                        {labelFor(v)} · {grouped[v].length}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grouped[v].map((d, i) => (
                        <motion.div
                          key={d.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.2) }}
                          data-testid={`doc-card-${d.id}`}
                          className="p-4 rounded-xl bg-surface border border-border flex items-start justify-between gap-3 group transition-all hover:bg-surface/70"
                          style={{ borderLeft: `2px solid ${ACCENT_MAP[v].accent}` }}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-primary text-sm truncate">{d.title}</p>
                            <p className="text-[11px] text-tertiary mt-1 font-mono">
                              {d.chunks_count} chunks · {new Date(d.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => onDelete(d.id)}
                            data-testid={`doc-delete-${d.id}`}
                            className="p-2 rounded-lg text-tertiary hover:text-red-400 hover:bg-void/60 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
