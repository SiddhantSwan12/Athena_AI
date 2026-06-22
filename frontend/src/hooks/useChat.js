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
        const data = await chatApi.send({
          query,
          vertical: vertical || undefined,
          conversation_id: conversationId || undefined,
        });
        const assistantMessage = {
          id: uuidv4(),
          role: "assistant",
          content: data.answer,
          vertical: data.vertical,
          classified_vertical: data.classified_vertical,
          sources: data.sources || [],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setConversationId(data.conversation_id);
        setActiveVerticalFromAnswer(data.vertical);
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
