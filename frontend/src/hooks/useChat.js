import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { chatApi } from "../lib/api";

const MIN_CHARACTERS_PER_FRAME = 3;
const MAX_CHARACTERS_PER_FRAME = 14;
const BACKLOG_CHARS_PER_STEP = 32;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [activeVerticalFromAnswer, setActiveVerticalFromAnswer] = useState(null);

  const sendMessage = useCallback(
    async (query, vertical, image = null, audio = null, youtube = null) => {
      setError(null);
      const messageText =
        query.trim() ||
        (youtube
          ? "Analyze this YouTube video."
          : audio
          ? "Analyze this audio recording."
          : "Analyze this image.");
      const attachment = image || audio || youtube;
      const attachmentType = youtube
        ? "youtube"
        : audio
        ? "audio"
        : "image";
      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: messageText,
        vertical,
        timestamp: new Date().toISOString(),
        attachments: attachment
          ? [
              attachmentType === "youtube"
                ? {
                    type: "youtube",
                    video_id: youtube.videoId,
                    url: youtube.url,
                    embed_url: youtube.embedUrl,
                    thumbnail_url: youtube.thumbnailUrl,
                  }
                : {
                    type: attachmentType,
                    name: attachment.file.name,
                    mime_type: attachment.file.type,
                    preview_url: attachment.previewUrl,
                  },
            ]
          : [],
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      let assistantId = null;
      let revealFrame = null;

      try {
        assistantId = uuidv4();
        let displayedContent = "";
        let pendingContent = "";
        let streamComplete = false;
        let resolveDrain;
        const drained = new Promise((resolve) => {
          resolveDrain = resolve;
        });

        const updateAssistantContent = () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: displayedContent } : m
            )
          );
        };

        const revealNextCharacters = () => {
          revealFrame = null;

          if (pendingContent.length > 0) {
            const adaptiveStep = Math.ceil(
              pendingContent.length / BACKLOG_CHARS_PER_STEP
            );
            const charactersThisFrame = Math.min(
              pendingContent.length,
              MAX_CHARACTERS_PER_FRAME,
              Math.max(MIN_CHARACTERS_PER_FRAME, adaptiveStep)
            );

            displayedContent += pendingContent.slice(0, charactersThisFrame);
            pendingContent = pendingContent.slice(charactersThisFrame);
            updateAssistantContent();
            revealFrame = window.requestAnimationFrame(revealNextCharacters);
            return;
          }

          if (streamComplete) resolveDrain();
        };

        const queueText = (text) => {
          pendingContent += text || "";
          if (pendingContent && revealFrame === null) {
            revealFrame = window.requestAnimationFrame(revealNextCharacters);
          }
        };

        const finalData = await chatApi.stream(
          {
            query: messageText,
            vertical: vertical || undefined,
            conversation_id: conversationId || undefined,
          },
          {
            onMeta: (data) => {
              setMessages((prev) => {
                const withMedia = data.transcript || data.video
                  ? prev.map((message) =>
                      message.id === userMessage.id
                        ? {
                            ...message,
                            attachments: message.attachments.map((item) => ({
                              ...item,
                              ...(data.transcript
                                ? {
                                    transcript: data.transcript,
                                    language_code: data.language_code,
                                    duration_seconds: data.duration_seconds,
                                  }
                                : {}),
                              ...(data.video || {}),
                            })),
                          }
                        : message
                    )
                  : prev;
                return [
                  ...withMedia,
                  {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  vertical: data.vertical,
                  classified_vertical: data.classified_vertical,
                  sources: data.sources || [],
                  web_sources: data.web_sources || [],
                  video: data.video || null,
                  timestamp: new Date().toISOString(),
                  isStreaming: true,
                  },
                ];
              });
              setActiveVerticalFromAnswer(data.vertical);
            },
            onToken: ({ text }) => {
              queueText(text);
            },
          },
          attachmentType === "youtube"
            ? { kind: "youtube", url: youtube.url }
            : attachment
            ? { kind: attachmentType, file: attachment.file }
            : null
        );

        const finalAnswer = finalData?.answer || displayedContent + pendingContent;
        if (finalAnswer.startsWith(displayedContent)) {
          pendingContent = finalAnswer.slice(displayedContent.length);
        }
        streamComplete = true;

        if (pendingContent && revealFrame === null) {
          revealFrame = window.requestAnimationFrame(revealNextCharacters);
        }
        if (!pendingContent && revealFrame === null) resolveDrain();
        await drained;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: finalAnswer,
                  vertical: finalData?.vertical || m.vertical,
                  classified_vertical:
                    finalData?.classified_vertical || m.classified_vertical,
                  sources: finalData?.sources || [],
                  web_sources: finalData?.web_sources || [],
                  video: finalData?.video || m.video || null,
                  isStreaming: false,
                }
              : m
          )
        );
        setConversationId(finalData?.conversation_id);
        setActiveVerticalFromAnswer(finalData?.vertical);
        return true;
      } catch (e) {
        if (revealFrame !== null) {
          window.cancelAnimationFrame(revealFrame);
        }
        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !== userMessage.id && message.id !== assistantId
          )
        );
        const msg = e?.response?.data?.detail || e.message || "Something went wrong";
        setError(typeof msg === "string" ? msg : "Request failed");
        return false;
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
        attachments: m.attachments || [],
        video: m.video || null,
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
