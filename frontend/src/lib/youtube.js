const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const YOUTUBE_SEEK_EVENT = "athena:youtube-seek";

export function normalizeYouTubeUrl(value) {
  const candidate = value.trim();
  if (!candidate) throw new Error("Paste a YouTube URL");

  let url;
  try {
    url = new URL(
      candidate.includes("://") ? candidate : `https://${candidate}`
    );
  } catch {
    throw new Error("Use a valid YouTube URL");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let videoId = "";

  if (host === "youtu.be") {
    videoId = parts[0] || "";
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else if (
      parts.length >= 2 &&
      ["shorts", "embed", "live"].includes(parts[0])
    ) {
      videoId = parts[1];
    }
  }

  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new Error("Use a valid YouTube video, Shorts, or youtu.be URL");
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export function youtubeUrlAtTime(videoId, seconds) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(
    0,
    Math.floor(seconds)
  )}s`;
}
