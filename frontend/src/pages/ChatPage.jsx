import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import Sidebar from "../components/Sidebar";
import VerticalPicker from "../components/VerticalPicker";
import MessageBubble from "../components/MessageBubble";
import ThinkingIndicator from "../components/ThinkingIndicator";
import ChatInput from "../components/ChatInput";
import { useChat } from "../hooks/useChat";
import { convosApi } from "../lib/api";
import { cn } from "../lib/cn";
import { accentClassFor, labelFor } from "../lib/verticals";

export default function ChatPage() {
  const nav = useNavigate();
  const [vertical, setVertical] = useState(undefined);
  const [input, setInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollRef = useRef(null);
  const {
    messages, isLoading, error, sendMessage, reset, hydrate, conversationId, activeVerticalFromAnswer,
  } = useChat();

  // Active vertical for UI accent: user picked > last answer's vertical > undefined
  const accentVertical = vertical || activeVerticalFromAnswer || undefined;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const submit = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    await sendMessage(q, vertical);
    setRefreshKey((k) => k + 1);
  };

  const handleSelectConversation = async (id) => {
    try {
      const c = await convosApi.get(id);
      hydrate(c);
    } catch (e) {
      toast.error("Couldn't load that conversation");
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    try {
      await convosApi.remove(conversationId);
      reset();
      setRefreshKey((k) => k + 1);
      toast.success("Conversation deleted");
    } catch {
      toast.error("Couldn't delete");
    }
  };

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const SUGGESTIONS = [
    { v: "finance",   q: "How should I think about diversifying a stock portfolio across asset classes?" },
    { v: "health",    q: "What are evidence-based ways to improve sleep quality long-term?" },
    { v: "education", q: "Explain the bias-variance tradeoff in machine learning with an example." },
  ];

  return (
    <div className={cn("h-screen flex athena-bg grain", accentClassFor(accentVertical))}>
      <Sidebar
        currentConversationId={conversationId}
        onNewChat={reset}
        onSelectConversation={handleSelectConversation}
        refreshKey={refreshKey}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-white/[0.05] backdrop-blur-sm bg-black/10">
          <div className="flex items-center gap-3">
            <VerticalPicker selected={vertical} onChange={setVertical} size="sm" />
            {activeVerticalFromAnswer && !vertical && (
              <span className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">
                Auto-routed → {labelFor(activeVerticalFromAnswer)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {conversationId && (
              <button
                onClick={handleDeleteConversation}
                data-testid="delete-conversation-btn"
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                title="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 sm:px-10 py-8" data-testid="chat-window">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center pt-20 pb-12 animate-fade-in" data-testid="empty-state">
                <div className="text-5xl mb-5">🦉</div>
                <h2 className="font-heading text-3xl sm:text-4xl font-light tracking-tighter text-white mb-2">
                  Ask Athena anything
                </h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Finance · Health · Education — auto-routed, or pick a domain above. Answers are grounded in your uploaded documents.
                </p>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setVertical(s.v); setInput(s.q); }}
                      data-testid={`suggestion-${s.v}`}
                      className={cn(
                        accentClassFor(s.v),
                        "text-left p-4 rounded-2xl glass border border-white/10 hover:border-accent hover:-translate-y-1 transition-all group"
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent">{labelFor(s.v)}</p>
                      <p className="mt-2 text-sm text-slate-300 group-hover:text-white leading-snug">{s.q}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => nav("/upload")}
                  data-testid="empty-state-upload-link"
                  className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  No documents indexed yet? Upload your first →
                </button>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isLoading && <ThinkingIndicator vertical={accentVertical} />}
          </div>
        </div>

        {/* Composer */}
        <div className="px-6 sm:px-10 py-4 border-t border-white/[0.05] backdrop-blur-sm bg-black/20">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={submit}
              disabled={isLoading}
              vertical={accentVertical}
            />
            <p className="text-center text-[11px] text-slate-600 mt-2">
              Athena cites every claim. Upload docs in the <span className="text-slate-400">Upload</span> tab for richer answers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
