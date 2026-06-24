import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

const SUGGESTION_POOL = [
  { v: "finance",       q: "How should I think about diversifying a stock portfolio across asset classes?" },
  { v: "health",        q: "What are evidence-based ways to improve sleep quality long-term?" },
  { v: "education",     q: "Explain the bias-variance tradeoff in machine learning with an example." },
  { v: "technology",    q: "Explain the architectural tradeoffs of HNSW vs IVF-PQ vector indexing." },
  { v: "geopolitics",   q: "What were the key trade outcomes of the 2024 EU-India bilateral summit?" },
  { v: "law",           q: "Does an NDA mutual non-solicitation clause typically survive termination?" },
  { v: "environment",   q: "What are Scope 3 emissions reporting exemptions under CSRD guidelines?" },
  { v: "business",      q: "Summarize typical Q3 revenue growth drivers from an earnings deck." },
  { v: "sports",        q: "What does literature say about eccentric loading for patellar tendinopathy?" },
  { v: "entertainment", q: "Compare box office and critical reception of Dune vs the 2021 film." },
];

export default function ChatPage() {
  const { vertical, setVertical, accent } = useVertical();
  const { messages, isLoading, error, sendMessage, reset, hydrate, conversationId, activeVerticalFromAnswer } = useChat();
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [youtube, setYoutube] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolledUp = useRef(false);
  const autoScrolling = useRef(false);
  const autoScrollFrame = useRef(null);
  const touchY = useRef(null);
  const nav = useNavigate();
  const hasStreamingAssistant = messages.some((m) => m.role === "assistant" && m.isStreaming);

  useEffect(() => {
    // Pick 3 random distinct suggestions
    const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 3));
  }, []);

  // Reflect the answer-detected vertical back into the UI accent when the user is on "Auto"
  useEffect(() => {
    if (!vertical && activeVerticalFromAnswer && ACCENT_MAP[activeVerticalFromAnswer]) {
      // We don't override the picker — but the page accent still reads from message tokens
    }
  }, [vertical, activeVerticalFromAnswer]);

  const onContainerScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || autoScrolling.current) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
  }, []);

  const onContainerWheel = useCallback((event) => {
    if (event.deltaY < 0) userScrolledUp.current = true;
  }, []);

  const onContainerTouchStart = useCallback((event) => {
    touchY.current = event.touches[0]?.clientY ?? null;
  }, []);

  const onContainerTouchMove = useCallback((event) => {
    const nextY = event.touches[0]?.clientY;
    if (touchY.current !== null && nextY > touchY.current) {
      userScrolledUp.current = true;
    }
    touchY.current = nextY ?? null;
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || userScrolledUp.current) return;

    autoScrolling.current = true;
    el.scrollTop = el.scrollHeight;

    if (autoScrollFrame.current) cancelAnimationFrame(autoScrollFrame.current);
    autoScrollFrame.current = requestAnimationFrame(() => {
      autoScrolling.current = false;
      autoScrollFrame.current = null;
    });

    return () => {
      if (autoScrollFrame.current) cancelAnimationFrame(autoScrollFrame.current);
      autoScrolling.current = false;
    };
  }, [messages, isLoading]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const submit = async () => {
    const q = input.trim();
    if ((!q && !image && !audio && !youtube) || isLoading) return;
    userScrolledUp.current = false;
    setInput("");
    const submittedImage = image;
    const submittedAudio = audio;
    const submittedYoutube = youtube;
    setImage(null);
    setAudio(null);
    setYoutube(null);
    const sent = await sendMessage(
      q,
      vertical || undefined,
      submittedImage,
      submittedAudio,
      submittedYoutube
    );
    if (!sent) {
      setInput(q);
      setImage(submittedImage);
      setAudio(submittedAudio);
      setYoutube(submittedYoutube);
      return;
    }
    setRefreshKey((k) => k + 1);
  };

  const handleSelect = async (id) => {
    try {
      setYoutube(null);
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
    setImage(null);
    setAudio(null);
    setYoutube(null);
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

        <div
          ref={scrollRef}
          onScroll={onContainerScroll}
          onWheel={onContainerWheel}
          onTouchStart={onContainerTouchStart}
          onTouchMove={onContainerTouchMove}
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-8 relative z-10"
          style={{ overflowAnchor: "none" }}
          data-testid="chat-window"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col min-h-[68vh] pb-12 pt-8" data-testid="empty-state">
                <div className="flex items-center gap-3 mb-7">
                  <span className="marker">№ 01 · today&apos;s session</span>
                  <div className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-quiet tabular">
                    {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-primary leading-[0.95] tracking-tight"
                  style={{ fontSize: "clamp(40px, 5.5vw, 76px)" }}
                >
                  What would you like to{" "}
                  <em className="italic font-medium" style={{ color: surfaceAccent }}>know</em>?
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.08 }}
                  className="mt-5 max-w-lg text-secondary text-[1rem] leading-[1.7]"
                >
                  Athena auto-routes to the right domain and grounds every answer
                  in your library. Pick a thread to begin, or
                  <em className="italic"> type freely below.</em>
                </motion.p>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestions.map((s, i) => {
                    const a = ACCENT_MAP[s.v].accent;
                    return (
                      <motion.button
                        key={i}
                        data-testid={`suggestion-${s.v}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.18 + i * 0.07 }}
                        whileHover={{ y: -2 }}
                        onClick={() => { setVertical(s.v); setInput(s.q); }}
                        className="text-left p-5 rounded-xl border bg-paper/40 hover:bg-paper transition-all"
                        style={{ borderColor: `${a}25` }}
                      >
                        <div className="flex items-center justify-between mb-3 font-mono text-[10px] uppercase tracking-[0.22em]">
                          <span style={{ color: a }}>{s.v}</span>
                          <span className="text-quiet tabular">0{i + 1}</span>
                        </div>
                        <p className="font-display italic text-primary text-lg leading-snug">{s.q}</p>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="mt-12 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-quiet"
                >
                  <span>or</span>
                  <button
                    onClick={() => nav("/upload")}
                    data-testid="empty-state-upload-link"
                    className="text-tertiary hover:text-primary transition-colors link-line"
                  >
                    + index a new document
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => nav("/library")}
                    className="text-tertiary hover:text-primary transition-colors link-line"
                  >
                    browse your library →
                  </button>
                </motion.div>
              </div>
            )}

            {messages.map((m, i) => (
              <MessageBubble key={m.id} message={m} index={i} />
            ))}

            <AnimatePresence>{isLoading && !hasStreamingAssistant && <ThinkingDots />}</AnimatePresence>
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="px-5 sm:px-8 py-4 border-t border-border bg-void/60 backdrop-blur-sm relative z-10">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={submit}
              isLoading={isLoading}
              image={image}
              onImageChange={setImage}
              audio={audio}
              onAudioChange={setAudio}
              youtube={youtube}
              onYoutubeChange={setYoutube}
            />
            <p className="text-center text-tertiary text-[11px] font-mono mt-2">
              Enter to send · Shift+Enter for newline · grounded in your documents
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
