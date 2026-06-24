import { useCallback, useEffect, useRef, useState } from "react";
import { speechApi } from "../lib/api";

const SAMPLE_RATE = 16000;
const COMMIT_TIMEOUT_MS = 1800;
const FILLER_WORD_PATTERN =
  /\b(?:u+h+|u+m+|e+r+m*|a+h+|m+h+m+|h+m+|h+uh+)\b[,.!?;:]*/gi;

function cleanSpeechTranscript(transcript) {
  return transcript
    .replace(FILLER_WORD_PATTERN, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function joinTranscript(base, transcript) {
  const cleanBase = base.trimEnd();
  const cleanTranscript = transcript.trimStart();
  if (!cleanBase) return cleanTranscript;
  if (!cleanTranscript) return cleanBase;
  return `${cleanBase} ${cleanTranscript}`;
}

function downsampleTo16Bit(input, inputRate) {
  if (inputRate === SAMPLE_RATE) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
  }

  const ratio = inputRate / SAMPLE_RATE;
  const length = Math.max(1, Math.round(input.length / ratio));
  const output = new Int16Array(length);

  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(input.length, Math.floor((index + 1) * ratio));
    let sum = 0;
    let count = 0;

    for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1) {
      sum += input[sourceIndex];
      count += 1;
    }

    const sample = Math.max(-1, Math.min(1, count ? sum / count : 0));
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}

function pcmToBase64(samples) {
  const bytes = new Uint8Array(samples.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useSpeechRecognition({ value, onChange }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const statusRef = useRef("idle");
  const valueRef = useRef(value);
  const baseTextRef = useRef("");
  const committedRef = useRef("");
  const partialRef = useRef("");
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const finishTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionRef = useRef(0);
  const levelFrameRef = useRef(null);
  const nextLevelRef = useRef(0);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const updateStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus;
    if (mountedRef.current) setStatus(nextStatus);
  }, []);

  const supported =
    typeof window !== "undefined" &&
    Boolean(window.WebSocket) &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(window.AudioContext || window.webkitAudioContext);

  const renderTranscript = useCallback(() => {
    const transcript = joinTranscript(
      committedRef.current,
      partialRef.current
    );
    onChange(joinTranscript(baseTextRef.current, transcript));
  }, [onChange]);

  const releaseAudio = useCallback(() => {
    if (levelFrameRef.current) {
      window.cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }
    nextLevelRef.current = 0;
    if (mountedRef.current) setAudioLevel(0);
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const finishSession = useCallback(() => {
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    releaseAudio();
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    updateStatus("idle");
  }, [releaseAudio, updateStatus]);

  const failSession = useCallback(
    (message, nextStatus = "error") => {
      sessionRef.current += 1;
      releaseAudio();
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      if (mountedRef.current) {
        setError(message);
      }
      updateStatus(nextStatus);
    },
    [releaseAudio, updateStatus]
  );

  const stop = useCallback(() => {
    if (!["listening", "paused"].includes(statusRef.current)) return;
    updateStatus("stopping");
    releaseAudio();

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      finishSession();
      return;
    }

    const silence = new Int16Array(320);
    socket.send(
      JSON.stringify({
        message_type: "input_audio_chunk",
        audio_base_64: pcmToBase64(silence),
        commit: true,
        sample_rate: SAMPLE_RATE,
      })
    );
    finishTimerRef.current = window.setTimeout(
      finishSession,
      COMMIT_TIMEOUT_MS
    );
  }, [finishSession, releaseAudio, updateStatus]);

  const pause = useCallback(async () => {
    if (statusRef.current !== "listening" || !audioContextRef.current) return;
    await audioContextRef.current.suspend();
    setAudioLevel(0);
    updateStatus("paused");
  }, [updateStatus]);

  const resume = useCallback(async () => {
    if (statusRef.current !== "paused" || !audioContextRef.current) return;
    await audioContextRef.current.resume();
    updateStatus("listening");
  }, [updateStatus]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    sessionRef.current += 1;
    onChange(baseTextRef.current);
    finishSession();
  }, [finishSession, onChange]);

  const start = useCallback(async () => {
    if (
      !supported ||
      ["connecting", "listening", "paused", "stopping"].includes(
        statusRef.current
      )
    ) {
      return;
    }

    setError(null);
    updateStatus("connecting");
    cancelledRef.current = false;
    baseTextRef.current = valueRef.current;
    committedRef.current = "";
    partialRef.current = "";
    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (cancelledRef.current || sessionRef.current !== sessionId) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = mediaStream;

      const { token } = await speechApi.realtimeToken();
      if (cancelledRef.current || sessionRef.current !== sessionId) {
        releaseAudio();
        return;
      }
      const params = new URLSearchParams({
        model_id: "scribe_v2_realtime",
        token,
        audio_format: "pcm_16000",
        commit_strategy: "vad",
        vad_silence_threshold_secs: "1.0",
      });
      const socket = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params}`
      );
      socketRef.current = socket;

      socket.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          failSession("ElevenLabs returned an invalid transcription response");
          return;
        }

        if (message.message_type === "partial_transcript") {
          partialRef.current = cleanSpeechTranscript(message.text || "");
          renderTranscript();
          return;
        }

        if (
          message.message_type === "committed_transcript" ||
          message.message_type === "committed_transcript_with_timestamps"
        ) {
          const committed = cleanSpeechTranscript(message.text || "");
          if (committed) {
            committedRef.current = joinTranscript(
              committedRef.current,
              committed
            );
          }
          partialRef.current = "";
          renderTranscript();

          if (statusRef.current === "stopping") finishSession();
          return;
        }

        if (message.message_type?.includes("error")) {
          failSession(
            message.error || message.message || "Speech recognition failed"
          );
        }
      };

      socket.onerror = () => {
        failSession("Could not connect to ElevenLabs speech recognition");
      };

      socket.onclose = () => {
        if (!cancelledRef.current && mountedRef.current) {
          releaseAudio();
          setStatus("idle");
        }
      };

      socket.onopen = async () => {
        if (cancelledRef.current || sessionRef.current !== sessionId) {
          socket.close();
          return;
        }
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        await audioContext.resume();

        const source = audioContext.createMediaStreamSource(mediaStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        const mutedOutput = audioContext.createGain();
        mutedOutput.gain.value = 0;

        sourceRef.current = source;
        processorRef.current = processor;
        processor.onaudioprocess = (audioEvent) => {
          if (socket.readyState !== WebSocket.OPEN) return;
          const input = audioEvent.inputBuffer.getChannelData(0);
          let sumSquares = 0;
          for (let index = 0; index < input.length; index += 1) {
            sumSquares += input[index] * input[index];
          }
          nextLevelRef.current = Math.min(
            1,
            Math.sqrt(sumSquares / input.length) * 7
          );
          if (!levelFrameRef.current) {
            levelFrameRef.current = window.requestAnimationFrame(() => {
              levelFrameRef.current = null;
              if (mountedRef.current && statusRef.current === "listening") {
                setAudioLevel(nextLevelRef.current);
              }
            });
          }
          const pcm = downsampleTo16Bit(input, audioContext.sampleRate);
          socket.send(
            JSON.stringify({
              message_type: "input_audio_chunk",
              audio_base_64: pcmToBase64(pcm),
              commit: false,
              sample_rate: SAMPLE_RATE,
            })
          );
        };

        source.connect(processor);
        processor.connect(mutedOutput);
        mutedOutput.connect(audioContext.destination);
        updateStatus("listening");
      };
    } catch (speechError) {
      const permissionDenied =
        speechError?.name === "NotAllowedError" ||
        speechError?.name === "PermissionDeniedError";
      failSession(
        permissionDenied
          ? "Microphone permission was denied"
          : speechError?.response?.data?.detail ||
              speechError?.message ||
              "Could not start speech recognition",
        permissionDenied ? "permission-denied" : "error"
      );
    }
  }, [
    failSession,
    finishSession,
    releaseAudio,
    renderTranscript,
    supported,
    updateStatus,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
      sessionRef.current += 1;
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
      releaseAudio();
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [releaseAudio]);

  return {
    status: supported ? status : "unsupported",
    error,
    audioLevel,
    isListening: status === "listening",
    isPaused: status === "paused",
    isBusy: status === "connecting" || status === "stopping",
    start,
    stop,
    pause,
    resume,
    cancel,
  };
}
