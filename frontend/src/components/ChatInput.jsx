import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "../lib/cn";
import { accentClassFor } from "../lib/verticals";

export default function ChatInput({ value, onChange, onSubmit, disabled, vertical }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
  }, [value]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-3 rounded-2xl p-2.5 glass-strong transition-all duration-300 border",
        accentClassFor(vertical),
        vertical ? "border-accent shadow-accent" : "border-white/10 focus-within:border-white/30"
      )}
    >
      <textarea
        ref={ref}
        data-testid="chat-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask about finance, health, or education…"
        rows={1}
        className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-[0.95rem] text-white placeholder:text-slate-500 max-h-48"
      />
      <button
        data-testid="chat-send-btn"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className={cn(
          "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
          "bg-accent text-white hover:-translate-y-0.5",
          (disabled || !value.trim()) && "opacity-30 cursor-not-allowed hover:translate-y-0"
        )}
        aria-label="Send"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
