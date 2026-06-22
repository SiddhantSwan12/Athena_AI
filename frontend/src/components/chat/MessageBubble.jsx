import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useVertical, ACCENT_MAP, labelFor } from "../../lib/VerticalContext";
import SourceDrawer from "./SourceDrawer";

export default function MessageBubble({ message, index }) {
  const isUser = message.role === "user";
  const { accent: ctxAccent } = useVertical();
  // Each assistant message remembers its own vertical accent (auto-route may differ from current UI vertical)
  const msgAccent = message.vertical && ACCENT_MAP[message.vertical]
    ? ACCENT_MAP[message.vertical].accent
    : ctxAccent;

  const ts = (() => {
    try {
      return new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2), ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={isUser ? "message-user" : "message-assistant"}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 text-sm border border-border bg-surface"
          style={{ boxShadow: `0 0 12px 0 ${msgAccent}40` }}
          aria-hidden
        >
          🦉
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[78%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? "text-white rounded-br-sm"
              : "bg-surface border text-primary rounded-bl-sm"
          }`}
          style={
            isUser
              ? { background: msgAccent, boxShadow: `0 0 24px 0 ${msgAccent}20` }
              : { borderColor: `${msgAccent}25` }
          }
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="prose-athena">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-1 text-[10px] font-mono">
          {message.vertical && (
            <span style={{ color: msgAccent }}>{labelFor(message.vertical).toLowerCase()}</span>
          )}
          {message.classified_vertical &&
            message.vertical !== message.classified_vertical && (
              <span className="text-tertiary">
                · auto-routed from {labelFor(message.classified_vertical).toLowerCase()}
              </span>
          )}
          <span className="text-tertiary">· {ts}</span>
        </div>

        {!isUser && message.sources?.length > 0 && (
          <SourceDrawer sources={message.sources} messageVertical={message.vertical} />
        )}
      </div>
    </motion.div>
  );
}
