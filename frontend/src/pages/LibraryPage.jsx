import { useEffect, useState } from "react";
import { Trash2, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Sidebar from "../components/Sidebar";
import { ingestApi } from "../lib/api";
import { cn } from "../lib/cn";
import { accentClassFor, labelFor } from "../lib/verticals";

export default function LibraryPage() {
  const nav = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = () => {
    setLoading(true);
    ingestApi
      .listDocuments()
      .then((d) => setDocs(d))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
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

  const grouped = docs.reduce((acc, d) => {
    (acc[d.vertical] = acc[d.vertical] || []).push(d);
    return acc;
  }, {});

  return (
    <div className="h-screen flex athena-bg grain">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" data-testid="library-page">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-4xl font-light tracking-tighter text-white">Documents</h1>
              <p className="mt-2 text-sm text-slate-400">Your indexed knowledge base · {docs.length} document{docs.length === 1 ? "" : "s"}</p>
            </div>
            <button
              onClick={() => nav("/upload")}
              data-testid="library-add-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0A0F1E] font-semibold text-sm transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> Index document
            </button>
          </div>

          {loading ? (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse-soft" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="mt-16 text-center py-16 rounded-3xl glass">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 font-medium">Your library is empty</p>
              <p className="text-sm text-slate-500 mt-1.5">Upload a PDF or paste text to get started.</p>
              <button
                onClick={() => nav("/upload")}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-sm font-medium transition-all"
                data-testid="library-empty-upload-btn"
              >
                Upload your first <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-10 space-y-10">
              {["finance", "health", "education"].map((v) =>
                grouped[v]?.length ? (
                  <section key={v} className={cn(accentClassFor(v))}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-accent">
                        {labelFor(v)} · {grouped[v].length}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grouped[v].map((d) => (
                        <div
                          key={d.id}
                          data-testid={`doc-card-${d.id}`}
                          className="p-4 rounded-2xl glass border-l-[3px] border-accent flex items-start justify-between gap-3 group hover:bg-white/[0.06] transition-all"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{d.title}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {d.chunks_count} chunks · {new Date(d.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => onDelete(d.id)}
                            data-testid={`doc-delete-${d.id}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
