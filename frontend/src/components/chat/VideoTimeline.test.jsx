import { act } from "react";
import { createRoot } from "react-dom/client";

import VideoTimeline from "./VideoTimeline";
import { YOUTUBE_SEEK_EVENT } from "../../lib/youtube";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("renders a chronological timeline and seeks the video", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const seek = jest.fn();
  window.addEventListener(YOUTUBE_SEEK_EVENT, seek);

  act(() => {
    root.render(
      <VideoTimeline
        videoId="dQw4w9WgXcQ"
        accent="#6B5BFF"
        timeline={[
          {
            id: "moment-1",
            type: "moment",
            timestamp: "00:10",
            timestamp_seconds: 10,
            title: "Opening",
            description: "The presenter introduces the subject.",
          },
          {
            id: "claim-1",
            type: "claim",
            timestamp: "00:20",
            timestamp_seconds: 20,
            title: "A factual claim.",
            description: "Evidence supports the claim.",
            verdict: "supported",
            evidence: [
              {
                id: "web-1",
                title: "Official evidence",
                url: "https://agency.gov/data",
                quality_label: "primary or official source",
                quality_score: 0.94,
              },
            ],
          },
        ]}
      />
    );
  });

  expect(host.textContent).toContain("Opening");
  expect(host.textContent).toContain("supported");
  const timestamp = host.querySelector('[aria-label="Play video at 00:20"]');
  act(() => {
    timestamp.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(seek.mock.calls[0][0].detail.seconds).toBe(20);
  const evidence = [...host.querySelectorAll("button")].find((button) =>
    button.textContent.includes("1 evidence source")
  );
  act(() => {
    evidence.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(host.textContent).toContain("Official evidence");
  expect(host.querySelector('a[href="https://agency.gov/data"]')).not.toBeNull();
  expect(evidence.getAttribute("aria-expanded")).toBe("true");
  expect(evidence.getAttribute("aria-controls")).toContain("evidence-");

  window.removeEventListener(YOUTUBE_SEEK_EVENT, seek);
  act(() => root.unmount());
  host.remove();
});

test("filters the timeline by claims and issues", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  act(() => {
    root.render(
      <VideoTimeline
        videoId="dQw4w9WgXcQ"
        accent="#6B5BFF"
        credibility={{
          label: "Mixed evidence alignment",
          alignment_score: 50,
          summary: "The claims had mixed support.",
          counts: {
            supported: 1,
            contradicted: 1,
            misleading: 0,
            unverified: 0,
          },
          disclaimer: "This is not proof of creator trustworthiness.",
        }}
        timeline={[
          {
            id: "moment-1",
            type: "moment",
            timestamp: "00:10",
            timestamp_seconds: 10,
            title: "Opening",
            description: "An observation.",
          },
          {
            id: "claim-1",
            type: "claim",
            timestamp: "00:20",
            timestamp_seconds: 20,
            title: "Supported claim",
            description: "Supported.",
            verdict: "supported",
          },
          {
            id: "claim-2",
            type: "claim",
            timestamp: "00:30",
            timestamp_seconds: 30,
            title: "Contradicted claim",
            description: "Contradicted.",
            verdict: "contradicted",
          },
        ]}
      />
    );
  });

  const claims = [...host.querySelectorAll("button")].find(
    (button) => button.textContent === "Claims"
  );
  act(() => {
    claims.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(host.textContent).not.toContain("Opening");
  expect(host.textContent).toContain("Supported claim");

  const issues = [...host.querySelectorAll("button")].find(
    (button) => button.textContent === "Issues"
  );
  act(() => {
    issues.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(host.textContent).not.toContain("Supported claim");
  expect(host.textContent).toContain("Contradicted claim");
  expect(host.textContent).toContain("50% evidence alignment");

  act(() => root.unmount());
  host.remove();
});
