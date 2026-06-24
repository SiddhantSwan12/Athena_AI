import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  FileAudio,
  ImagePlus,
  Link2,
  Mic,
  Pause,
  Play,
  X,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { useVertical } from "../../lib/VerticalContext";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { normalizeYouTubeUrl } from "../../lib/youtube";

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
];
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export default function ChatInputNew({
  value,
  onChange,
  onSend,
  isLoading,
  image,
  onImageChange,
  audio,
  onAudioChange,
  youtube,
  onYoutubeChange,
}) {
  const { accent } = useVertical();
  const ref = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeDraft, setYoutubeDraft] = useState("");
  const {
    status: speechStatus,
    error: speechError,
    audioLevel,
    isListening,
    isPaused,
    isBusy: isSpeechBusy,
    start: startSpeech,
    stop: stopSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    cancel: cancelSpeech,
  } = useSpeechRecognition({ value, onChange });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  useEffect(() => {
    if (speechError) toast.error(speechError);
  }, [speechError]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onSend();
    }
  };

  const speechUnavailable = speechStatus === "unsupported";
  const speechActive = isListening || isPaused || isSpeechBusy;
  const disabled =
    isLoading ||
    speechActive ||
    (!value.trim() && !image && !audio && !youtube);
  const speechLabel = isListening || isPaused
    ? "Stop voice input"
    : isSpeechBusy
    ? "Voice input is starting"
    : "Start voice input";

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Use a PNG, JPEG, WebP, HEIC, or HEIF image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 8 MB or smaller");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onImageChange({
        file,
        previewUrl: String(reader.result || ""),
      });
    };
    reader.onerror = () => toast.error("Could not preview that image");
    reader.readAsDataURL(file);
  };

  const selectAudio = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!AUDIO_TYPES.includes(file.type)) {
      toast.error("Use an MP3, WAV, M4A, WebM, OGG, or AAC audio file");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      toast.error("Audio must be 4 MB or smaller");
      return;
    }

    onAudioChange({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const attachYoutube = () => {
    try {
      onYoutubeChange(normalizeYouTubeUrl(youtubeDraft));
      setYoutubeDraft("");
      setShowYoutubeInput(false);
    } catch (error) {
      toast.error(error?.message || "Use a valid YouTube URL");
    }
  };

  return (
    <div className="relative">
      {image && (
        <div
          className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
          data-testid="chat-image-preview"
        >
          <img
            src={image.previewUrl}
            alt=""
            className="h-12 w-12 rounded-md border border-border object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-primary">{image.file.name}</p>
            <p className="font-mono text-[10px] text-tertiary">
              {(image.file.size / 1024 / 1024).toFixed(2)} MB · image
            </p>
          </div>
          <button
            type="button"
            onClick={() => onImageChange(null)}
            aria-label="Remove attached image"
            title="Remove attached image"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-muted/40 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {audio && (
        <div
          className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
          data-testid="chat-audio-preview"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border"
            style={{ color: accent, background: `${accent}12` }}
          >
            <FileAudio className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-primary">{audio.file.name}</p>
            <p className="font-mono text-[10px] text-tertiary">
              {(audio.file.size / 1024 / 1024).toFixed(2)} MB · audio
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(audio.previewUrl);
              onAudioChange(null);
            }}
            aria-label="Remove attached audio"
            title="Remove attached audio"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-muted/40 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {youtube && (
        <div
          className="mb-2 overflow-hidden rounded-lg border border-border bg-surface"
          data-testid="chat-youtube-preview"
        >
          <div className="grid gap-3 p-3 sm:grid-cols-[160px_1fr]">
            <img
              src={youtube.thumbnailUrl}
              alt=""
              className="aspect-video w-full rounded-md border border-border object-cover"
            />
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <span>YouTube video</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-tertiary">
                    {youtube.url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onYoutubeChange(null);
                  }}
                  aria-label="Remove YouTube video"
                  title="Remove YouTube video"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-muted/40 hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 font-mono text-[10px] text-tertiary">
                Public videos only · audio and visuals analyzed together
              </p>
            </div>
          </div>
        </div>
      )}
      {showYoutubeInput && !youtube && (
        <div className="mb-2 flex gap-2 rounded-lg border border-border bg-surface p-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-red-500">
            <Youtube className="h-5 w-5" />
          </div>
          <input
            type="url"
            value={youtubeDraft}
            onChange={(event) => setYoutubeDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                attachYoutube();
              }
              if (event.key === "Escape") setShowYoutubeInput(false);
            }}
            autoFocus
            placeholder="Paste a YouTube video or Shorts URL"
            className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
            data-testid="chat-youtube-url-input"
          />
          <button
            type="button"
            onClick={attachYoutube}
            className="h-9 rounded-lg px-3 text-xs text-white"
            style={{ background: accent }}
          >
            Attach
          </button>
          <button
            type="button"
            onClick={() => {
              setYoutubeDraft("");
              setShowYoutubeInput(false);
            }}
            aria-label="Cancel YouTube link"
            className="flex h-9 w-9 items-center justify-center text-tertiary hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className="flex items-end gap-2 p-3 rounded-2xl border bg-surface transition-all duration-300"
        style={{ borderColor: speechActive || value ? `${accent}55` : "#1F2937" }}
        data-testid="chat-input-wrapper"
      >
        <textarea
          ref={ref}
          data-testid="chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          readOnly={speechActive}
          placeholder="Ask Athena anything…"
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-primary placeholder:text-tertiary font-sans leading-relaxed py-1.5 min-w-0"
          style={{ maxHeight: 160 }}
        />

        <input
          ref={imageInputRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          onChange={selectImage}
          className="sr-only"
          data-testid="chat-image-input"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={Boolean(image || audio || youtube) || speechActive || isLoading}
          aria-label="Attach image"
          title={
            image || audio || youtube
              ? "Remove the current attachment before adding an image"
              : "Attach image"
          }
          data-testid="chat-image-btn"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-tertiary transition-colors hover:border-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ImagePlus className="h-4 w-4" />
        </button>

        <input
          ref={audioInputRef}
          type="file"
          accept={AUDIO_TYPES.join(",")}
          onChange={selectAudio}
          className="sr-only"
          data-testid="chat-audio-input"
        />
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          disabled={Boolean(image || audio || youtube) || speechActive || isLoading}
          aria-label="Attach audio"
          title={
            audio || image || youtube
              ? "Remove the current attachment before adding audio"
              : "Attach audio"
          }
          data-testid="chat-audio-btn"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-tertiary transition-colors hover:border-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileAudio className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowYoutubeInput((current) => !current)}
          disabled={Boolean(image || audio || youtube) || speechActive || isLoading}
          aria-label="Attach YouTube video"
          title={
            image || audio || youtube
              ? "Remove the current attachment before adding a YouTube video"
              : "Attach YouTube video"
          }
          data-testid="chat-youtube-btn"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-tertiary transition-colors hover:border-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Link2 className="h-4 w-4" />
        </button>

        {(isListening || isPaused) && (
          <button
            type="button"
            onClick={isPaused ? resumeSpeech : pauseSpeech}
            aria-label={isPaused ? "Resume voice input" : "Pause voice input"}
            title={isPaused ? "Resume voice input" : "Pause voice input"}
            aria-pressed={isPaused}
            data-testid="chat-voice-pause-btn"
            className="w-9 h-9 rounded-lg border border-border text-tertiary hover:text-primary hover:border-muted flex items-center justify-center shrink-0 transition-colors"
          >
            {isPaused ? (
              <Play className="w-4 h-4 fill-current" />
            ) : (
              <Pause className="w-4 h-4 fill-current" />
            )}
          </button>
        )}

        {speechActive && (
          <button
            type="button"
            onClick={cancelSpeech}
            aria-label="Cancel voice input"
            title="Cancel voice input"
            data-testid="chat-voice-cancel-btn"
            className="w-9 h-9 rounded-lg border border-border text-tertiary hover:text-primary hover:border-muted flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={isListening || isPaused ? stopSpeech : startSpeech}
          disabled={speechUnavailable || isSpeechBusy || isLoading}
          aria-label={speechLabel}
          aria-pressed={isListening || isPaused}
          title={
            speechUnavailable
              ? "Voice input is unavailable in this browser"
              : speechLabel
          }
          data-testid="chat-voice-btn"
          className={`relative w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            isListening || isPaused
              ? "text-white"
              : "border-border text-tertiary hover:text-primary hover:border-muted"
          }`}
          style={
            isListening || isPaused
              ? {
                  background: accent,
                  borderColor: accent,
                  boxShadow: `0 0 0 4px ${accent}20`,
                }
              : {}
          }
        >
          {isListening ? (
            <AudioLines
              className="w-4 h-4"
              style={{
                transform: `scale(${1 + audioLevel * 0.35}) rotate(${
                  (audioLevel - 0.5) * 4
                }deg)`,
                transition: "transform 70ms linear",
              }}
            />
          ) : isPaused ? (
            <Mic className="w-4 h-4 opacity-70" />
          ) : (
            <Mic className={`w-4 h-4 ${isSpeechBusy ? "animate-pulse" : ""}`} />
          )}
          {isListening && (
            <span
              aria-hidden
              className="absolute inset-[-5px] rounded-xl border animate-ping"
              style={{ borderColor: `${accent}55` }}
            />
          )}
        </button>

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

      <span className="sr-only" aria-live="polite">
        {speechStatus === "connecting" && "Connecting voice input"}
        {speechStatus === "listening" && "Voice input is listening"}
        {speechStatus === "paused" && "Voice input is paused"}
        {speechStatus === "stopping" && "Finishing voice transcription"}
        {speechStatus === "permission-denied" && "Microphone permission denied"}
        {speechStatus === "error" && "Voice input failed"}
      </span>
    </div>
  );
}
