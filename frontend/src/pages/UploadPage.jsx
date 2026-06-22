import Sidebar from "../components/Sidebar";
import DocumentUploader from "../components/DocumentUploader";

export default function UploadPage() {
  return (
    <div className="h-screen flex athena-bg grain">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" data-testid="upload-page">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12">
          <h1 className="font-heading text-4xl font-light tracking-tighter text-white">Index a document</h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
            Drop a PDF, TXT, or markdown file (or paste raw text). Athena chunks, embeds with Gemini, and stores in your private vector index — instantly available in chat.
          </p>

          <div className="mt-10 p-6 sm:p-8 rounded-3xl glass-strong">
            <DocumentUploader />
          </div>

          <div className="mt-8 text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold uppercase tracking-[0.2em] text-[10px] text-slate-500 mb-2">Tips</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Tag the right vertical — it determines which chunks are searched.</li>
              <li>Bigger documents are auto-split into ~900-char overlapping chunks.</li>
              <li>Embeddings use <span className="font-mono text-slate-400">gemini-embedding-001</span>.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
