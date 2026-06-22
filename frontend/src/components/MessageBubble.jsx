import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/cn";
import { accentClassFor, labelFor } from "../lib/verticals";

function SourceCard({ source, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      data-testid={`source-card-${idx}`}
      className="rounded-xl glass border-l-[3px] border-accent overflow-hidden transition-all"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
        data-testid={`source-toggle-${idx}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="text-xs text-slate-300 truncate font-mono">
            [Source {idx + 1}] {source.title || "document"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold">
            {(source.similarity * 100).toFixed(0)}% match
          </span>
          <ChevronDown
            className={cn("w-3.5 h-3.5 text-slate-500 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-white/5 font-mono text-xs text-slate-400 leading-relaxed whitespace-pre-wrap break-words animate-fade-in">
          {source.content}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const accent = accentClassFor(message.vertical);

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up" data-testid="message-user">
        <div className="max-w-[78%] px-5 py-3 rounded-2xl rounded-tr-md bg-white/[0.06] border border-white/10 text-slate-100 text-[0.95rem] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 animate-slide-up", accent)} data-testid="message-assistant">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-accent"
          style={{ backgroundColor: "var(--accent-dim)" }}
          title={`Athena · ${labelFor(message.vertical)}`}
        >
          <span aria-hidden>🦉</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-white">Athena</span>
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-accent">
              {labelFor(message.vertical)}
            </span>
          </div>
          <div className="prose-athena">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>

      {message.sources && message.sources.length > 0 && (
        <div className="ml-11 space-y-2" data-testid="source-list">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">
            Cited sources · {message.sources.length}
          </p>
          {message.sources.map((s, i) => (
            <SourceCard key={s.id || i} source={s} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}
