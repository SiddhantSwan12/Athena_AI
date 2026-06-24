import { normalizeYouTubeUrl, youtubeUrlAtTime } from "./youtube";

test.each([
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ?t=20",
  "https://youtube.com/shorts/dQw4w9WgXcQ",
  "youtube.com/live/dQw4w9WgXcQ",
])("normalizes supported YouTube URLs", (url) => {
  expect(normalizeYouTubeUrl(url)).toMatchObject({
    videoId: "dQw4w9WgXcQ",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  });
});

test("rejects URLs outside YouTube", () => {
  expect(() =>
    normalizeYouTubeUrl("https://example.com/watch?v=dQw4w9WgXcQ")
  ).toThrow("YouTube");
});

test("builds timestamped YouTube links", () => {
  expect(youtubeUrlAtTime("dQw4w9WgXcQ", 42.8)).toBe(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"
  );
});
