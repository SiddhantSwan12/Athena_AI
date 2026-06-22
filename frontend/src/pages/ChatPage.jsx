import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import TopBar from "../components/layout/TopBar";
import ConversationsRail from "../components/layout/ConversationsRail";
import ChatInput from "../components/chat/ChatInput";
import MessageBubble from "../components/chat/MessageBubble";
import ThinkingDots from "../components/chat/ThinkingDots";

import { useChat } from "../hooks/useChat";
import { useVertical, ACCENT_MAP } from "../lib/VerticalContext";
import { convosApi } from "../lib/api";

const SUGGESTIONS = [
  { v: "finance",   q: "How should I think about diversifying a stock portfolio across asset classes?" },
  { v: "health",    q: "What are evidence-based ways to improve sleep quality long-term?" },
  { v: "education", q: "Explain the bias-variance tradeoff in machine learning with an example." },
];

export default function ChatPage() {
  const { vertical, setVertical, accent } = useVertical();
  const { messages, isLoading, error, sendMessage, reset, hydrate, conversationId, activeVerticalFromAnswer } = useChat();
  const [input, setInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollRef = useRef(null);
  const nav = useNavigate();

  // Reflect the answer-detected vertical back into the UI accent when the user is on "Auto"
  useEffect(() => {
    if (!vertical && activeVerticalFromAnswer && ACCENT_MAP[activeVerticalFromAnswer]) {
      // We don't override the picker — but the page accent still reads from message tokens
    }
  }, [vertical, activeVerticalFromAnswer]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const submit = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    await sendMessage(q, vertical || undefined);
    setRefreshKey((k) => k + 1);
  };

  const handleSelect = async (id) => {
    try {
      const c = await convosApi.get(id);
      hydrate(c);
      if (c.vertical && ACCENT_MAP[c.vertical]) setVertical(c.vertical);
    } catch {
      toast.error("Couldn't load that conversation");
    }
  };

  const handleNew = () => {
    reset();
    setInput("");
  };

  // Vertical for the accent layer (background flare):
  // user-pick > activeVerticalFromAnswer > finance (default)
  const surfaceAccent = vertical
    ? ACCENT_MAP[vertical].accent
    : activeVerticalFromAnswer
    ? ACCENT_MAP[activeVerticalFromAnswer].accent
    : accent;

  return (
    <div className="flex h-screen bg-void text-primary">
      <ConversationsRail
        currentId={conversationId}
        refreshKey={refreshKey}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={() => setRefreshKey((k) => k + 1)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <TopBar onClear={messages.length ? handleNew : undefined} />

        {/* Single ambient accent halo, top-right of the chat surface */}
        <motion.div
          aria-hidden
          className="absolute top-16 right-[-20%] w-[520px] h-[520px] rounded-full pointer-events-none"
          animate={{
            background: `radial-gradient(ellipse at center, ${surfaceAccent}10 0%, transparent 70%)`,
          }}
          transition={{ duration: 0.8 }}
          style={{ filter: "blur(40px)" }}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 relative z-10" data-testid="chat-window">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center pb-12" data-testid="empty-state">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-5xl mb-4"
                >
                  🦉
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="font-display font-bold text-3xl sm:text-4xl text-primary tracking-tight"
                >
                  Ask Athena anything.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.12 }}
                  className="mt-3 text-secondary text-sm max-w-md leading-relaxed"
                >
                  Switch domains above or let Athena auto-detect.
                  Answers are grounded in your documents with full citations.
                </motion.p>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl w-full">
                  {SUGGESTIONS.map((s, i) => {
                    const a = ACCENT_MAP[s.v].accent;
                    return (
                      <motion.button
                        key={i}
                        data-testid={`suggestion-${s.v}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.18 + i * 0.07 }}
                        whileHover={{ y: -2 }}
                        onClick={() => { setVertical(s.v); setInput(s.q); }}
                        className="text-left p-4 rounded-2xl border bg-surface/40 hover:bg-surface transition-all"
                        style={{ borderColor: `${a}25` }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em] font-mono" style={{ color: a }}>
                          {s.v}
                        </p>
                        <p className="mt-2 text-sm text-primary/90 leading-snug">{s.q}</p>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  onClick={() => nav("/upload")}
                  data-testid="empty-state-upload-link"
                  className="mt-10 text-tertiary hover:text-secondary text-xs font-mono transition-colors"
                >
                  No documents indexed yet? Upload your first →
                </motion.button>
              </div>
            )}

            {messages.map((m, i) => (
              <MessageBubble key={m.id} message={m} index={i} />
            ))}

            <AnimatePresence>{isLoading && <ThinkingDots />}</AnimatePresence>
          </div>
        </div>

        <div className="px-5 sm:px-8 py-4 border-t border-border bg-void/60 backdrop-blur-sm relative z-10">
          <div className="max-w-3xl mx-auto">
            <ChatInput value={input} onChange={setInput} onSend={submit} isLoading={isLoading} />
            <p className="text-center text-tertiary text-[11px] font-mono mt-2">
              Enter to send · Shift+Enter for newline · grounded in your documents
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
