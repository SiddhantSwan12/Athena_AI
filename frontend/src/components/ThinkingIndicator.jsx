import { cn } from "../lib/cn";
import { accentClassFor, labelFor } from "../lib/verticals";

export default function ThinkingIndicator({ vertical }) {
  return (
    <div
      data-testid="thinking-indicator"
      className={cn("flex items-center gap-3 animate-fade-in", accentClassFor(vertical))}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-accent"
        style={{ backgroundColor: "var(--accent-dim)" }}
      >
        <span aria-hidden>🦉</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 font-medium">
          Athena is thinking
          <span className="text-accent ml-1">· {labelFor(vertical)}</span>
        </span>
        <div className="flex items-center gap-1 ml-1">
          <span className="dot animate-thinking" style={{ animationDelay: "0ms" }} />
          <span className="dot animate-thinking" style={{ animationDelay: "160ms" }} />
          <span className="dot animate-thinking" style={{ animationDelay: "320ms" }} />
        </div>
      </div>
    </div>
  );
}
