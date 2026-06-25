import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useVertical, ACCENT_MAP, labelFor } from "../../lib/VerticalContext";
import SourceDrawer from "./SourceDrawer";
import MermaidDiagram from "./MermaidDiagram";
import FactCheckPanel from "./FactCheckPanel";
import { OwlIcon } from "../Icons";
import { Clock3, FileAudio, Youtube } from "lucide-react";
import { YOUTUBE_SEEK_EVENT } from "../../lib/youtube";

const remarkPlugins = [remarkGfm];

function formatTimestamp(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = String(total % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${remaining}`
    : `${minutes}:${remaining}`;
}

function YouTubeAttachment({ attachment }) {
  const videoId = attachment.video_id;
  const [startSeconds, setStartSeconds] = useState(0);

  useEffect(() => {
    const seek = (event) => {
      if (event.detail?.videoId !== videoId) return;
      setStartSeconds(Math.max(0, Math.floor(event.detail.seconds || 0)));
    };
    window.addEventListener(YOUTUBE_SEEK_EVENT, seek);
    return () => window.removeEventListener(YOUTUBE_SEEK_EVENT, seek);
  }, [videoId]);

  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}?start=${startSeconds}&autoplay=${
    startSeconds > 0 ? 1 : 0
  }&rel=0`;

  return (
    <div className="overflow-hidden rounded-lg border border-white/20 bg-black">
      <iframe
        key={`${videoId}-${startSeconds}`}
        src={src}
        title="Attached YouTube video"
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="flex items-center gap-2 px-3 py-2 font-mono text-[10px]">
        <Youtube className="h-4 w-4 text-white" />
        <span className="truncate">{attachment.url}</span>
        {startSeconds > 0 && (
          <span className="ml-auto shrink-0 opacity-75">
            {formatTimestamp(startSeconds)}
          </span>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ node, inline, className, children, accent, isStreaming, ...props }) {
  const lang = /language-(\w+)/.exec(className || "")?.[1];
  const code = String(children).replace(/\n$/, "");

  if (!inline && lang === "mermaid") {
    if (isStreaming) {
      return (
        <div
          className="flex items-center gap-2 p-3 rounded-xl border my-3 font-mono text-xs"
          style={{ borderColor: `${accent}30`, color: accent, background: "rgba(0,0,0,0.25)" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          diagram will render when complete…
        </div>
      );
    }
    return <MermaidDiagram code={code} accent={accent} />;
  }

  if (!inline) {
    return (
      <pre className="prose-athena-pre" {...props}>
        <code className={className}>{children}</code>
      </pre>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export default function MessageBubble({ message, index }) {
  const isUser = message.role === "user";
  const { accent: ctxAccent } = useVertical();
  const msgAccent =
    message.vertical && ACCENT_MAP[message.vertical]
      ? ACCENT_MAP[message.vertical].accent
      : ctxAccent;

  const ts = (() => {
    try {
      return new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  const components = {
    code: (props) => (
      <CodeBlock {...props} accent={msgAccent} isStreaming={message.isStreaming} />
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="athena-table">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="athena-thead">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="athena-tr">{children}</tr>,
    th: ({ children }) => <th className="athena-th">{children}</th>,
    td: ({ children }) => <td className="athena-td">{children}</td>,
  };

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
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 border border-border bg-surface"
          style={{ boxShadow: `0 0 12px 0 ${msgAccent}40`, color: msgAccent }}
          aria-hidden
        >
          <OwlIcon size={15} />
        </div>
      )}

      <div
        className={`flex flex-col gap-2 max-w-[78%] min-w-0 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
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
            <div className="space-y-2">
              {message.attachments?.map((attachment, attachmentIndex) => (
                <div
                  key={`${attachment.name || attachment.type}-${attachmentIndex}`}
                  className="overflow-hidden rounded-lg border border-white/20 bg-black/15"
                >
                  {attachment.type === "audio" ? (
                    <div className="space-y-2 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <FileAudio className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {attachment.name || "audio attachment"}
                        </span>
                        {attachment.duration_seconds > 0 && (
                          <span className="shrink-0 opacity-70">
                            {Math.floor(attachment.duration_seconds / 60)}:
                            {String(
                              Math.round(attachment.duration_seconds % 60)
                            ).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      {attachment.preview_url && (
                        <audio
                          controls
                          preload="metadata"
                          src={attachment.preview_url}
                          className="h-8 w-full max-w-sm"
                        >
                          <track kind="captions" />
                        </audio>
                      )}
                      {attachment.transcript && (
                        <details className="text-left">
                          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] opacity-75">
                            View transcript
                          </summary>
                          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap border-t border-white/15 pt-2 text-xs leading-relaxed">
                            {attachment.transcript}
                          </p>
                        </details>
                      )}
                    </div>
                  ) : attachment.type === "youtube" ? (
                    <YouTubeAttachment attachment={attachment} />
                  ) : attachment.preview_url ? (
                    <img
                      src={attachment.preview_url}
                      alt={attachment.name || "Attached image"}
                      className="block max-h-64 w-full object-contain"
                    />
                  ) : (
                    <div className="px-3 py-2 text-xs font-mono">
                      image · {attachment.name || "attachment"}
                    </div>
                  )}
                </div>
              ))}
              <span className="block">{message.content}</span>
            </div>
          ) : (
            <div className="prose-athena">
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                components={components}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <motion.span
                  aria-hidden
                  className="inline-block w-1.5 h-4 ml-1 align-[-2px] rounded-full"
                  style={{ background: msgAccent }}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-1 text-[10px] font-mono">
          {message.vertical && (
            <span style={{ color: msgAccent }}>
              {labelFor(message.vertical).toLowerCase()}
            </span>
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
          <SourceDrawer
            sources={message.sources}
            webSources={message.web_sources || []}
            messageVertical={message.vertical}
          />
        )}
        {!isUser && message.video?.moments?.length > 0 && (
          <div
            className="w-full rounded-lg border border-border bg-surface/70 p-3"
            data-testid="youtube-moments"
          >
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-tertiary">
              <Clock3 className="h-3.5 w-3.5" />
              Video moments
            </div>
            <div className="flex flex-wrap gap-2">
              {message.video.moments.map((moment, momentIndex) => (
                <button
                  key={`${moment.timestamp_seconds}-${momentIndex}`}
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent(YOUTUBE_SEEK_EVENT, {
                        detail: {
                          videoId: message.video.video_id,
                          seconds: moment.timestamp_seconds,
                        },
                      })
                    )
                  }
                  title={moment.observation}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-left text-xs text-secondary transition-colors hover:text-primary"
                  style={{ borderColor: `${msgAccent}35` }}
                >
                  <span className="font-mono" style={{ color: msgAccent }}>
                    {moment.timestamp ||
                      formatTimestamp(moment.timestamp_seconds)}
                  </span>
                  <span>{moment.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {!isUser && message.video?.fact_checks?.length > 0 && (
          <FactCheckPanel
            factChecks={message.video.fact_checks}
            videoId={message.video.video_id}
            credibility={message.video.credibility}
          />
        )}
        {!isUser && !message.sources?.length && message.web_sources?.length > 0 && (
          <SourceDrawer
            sources={[]}
            webSources={message.web_sources}
            messageVertical={message.vertical}
          />
        )}
      </div>
    </motion.div>
  );
}
