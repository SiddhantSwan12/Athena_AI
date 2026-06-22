import TopBar from "../components/layout/TopBar";
import DocumentUploader from "../components/DocumentUploader";

export default function UploadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-void text-primary">
      <TopBar showSwitcher={false} />
      <main className="flex-1 overflow-y-auto" data-testid="upload-page">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-tertiary">Athena · Index</p>
          <h1 className="mt-2 font-display font-bold text-4xl text-primary tracking-tight">Index a document</h1>
          <p className="mt-3 text-sm text-secondary leading-relaxed max-w-xl">
            Drop a PDF, TXT, or markdown file (or paste raw text). Athena chunks, embeds with Gemini,
            and stores in your private vector index — instantly available in chat.
          </p>

          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-surface border border-border">
            <DocumentUploader />
          </div>

          <div className="mt-8 text-[11px] text-tertiary leading-relaxed font-mono">
            <p className="uppercase tracking-[0.2em] mb-2">Tips</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Tag the right vertical — it determines which chunks are searched.</li>
              <li>Bigger documents are auto-split into ~900-char overlapping chunks.</li>
              <li>Embeddings use <span className="text-secondary">gemini-embedding-001</span> (3072 dim).</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
