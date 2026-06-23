import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { chatApi } from "../lib/api";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [activeVerticalFromAnswer, setActiveVerticalFromAnswer] = useState(null);

  const sendMessage = useCallback(
    async (query, vertical) => {
      setError(null);
      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: query,
        vertical,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const assistantId = uuidv4();
        let streamedContent = "";

        await chatApi.stream(
          {
            query,
            vertical: vertical || undefined,
            conversation_id: conversationId || undefined,
          },
          {
            onMeta: (data) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  vertical: data.vertical,
                  classified_vertical: data.classified_vertical,
                  sources: data.sources || [],
                  web_sources: data.web_sources || [],
                  timestamp: new Date().toISOString(),
                  isStreaming: true,
                },
              ]);
              setActiveVerticalFromAnswer(data.vertical);
            },
            onToken: ({ text }) => {
              streamedContent += text || "";
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: streamedContent } : m
                )
              );
            },
            onDone: (data) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: data.answer || streamedContent,
                        vertical: data.vertical,
                        classified_vertical: data.classified_vertical,
                        sources: data.sources || [],
                        web_sources: data.web_sources || [],
                        isStreaming: false,
                      }
                    : m
                )
              );
              setConversationId(data.conversation_id);
              setActiveVerticalFromAnswer(data.vertical);
            },
          }
        );
      } catch (e) {
        const msg = e?.response?.data?.detail || e.message || "Something went wrong";
        setError(typeof msg === "string" ? msg : "Request failed");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setActiveVerticalFromAnswer(null);
  }, []);

  const hydrate = useCallback((conversation) => {
    if (!conversation) return;
    setConversationId(conversation.id);
    setMessages(
      (conversation.messages || []).map((m) => ({
        id: m.id || uuidv4(),
        role: m.role,
        content: m.content,
        vertical: m.vertical,
        classified_vertical: m.classified_vertical,
        sources: m.sources || [],
        web_sources: m.web_sources || [],
        timestamp: m.timestamp,
      }))
    );
    setActiveVerticalFromAnswer(conversation.vertical || null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    activeVerticalFromAnswer,
    sendMessage,
    reset,
    hydrate,
  };
}
