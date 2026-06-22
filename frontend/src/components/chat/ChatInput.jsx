import { useEffect, useRef } from "react";
import { useVertical } from "../../lib/VerticalContext";

export default function ChatInputNew({ value, onChange, onSend, isLoading }) {
  const { accent } = useVertical();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  };

  const disabled = isLoading || !value.trim();

  return (
    <div
      className="flex items-end gap-3 p-3 rounded-2xl border bg-surface transition-all duration-300"
      style={{ borderColor: value ? `${accent}55` : "#1F2937" }}
      data-testid="chat-input-wrapper"
    >
      <textarea
        ref={ref}
        data-testid="chat-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask Athena anything…"
        rows={1}
        className="flex-1 bg-transparent resize-none outline-none text-sm text-primary placeholder:text-tertiary font-sans leading-relaxed py-1.5"
        style={{ maxHeight: 160 }}
      />
      <button
        data-testid="chat-send-btn"
        onClick={onSend}
        disabled={disabled}
        className={`px-4 h-9 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 shrink-0 ${
          !disabled ? "text-white hover:-translate-y-0.5" : "bg-muted text-tertiary cursor-not-allowed"
        }`}
        style={!disabled ? { background: accent, boxShadow: `0 0 20px 0 ${accent}30` } : {}}
      >
        {isLoading ? "…" : "Send"}
      </button>
    </div>
  );
}
