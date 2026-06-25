import { act } from "react";
import { createRoot } from "react-dom/client";

import FactCheckPanel from "./FactCheckPanel";
import { YOUTUBE_SEEK_EVENT } from "../../lib/youtube";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const checks = [
  {
    id: "claim-15",
    claim: "The measured value was 42.",
    timestamp: "00:15",
    timestamp_seconds: 15,
    verdict: "supported",
    confidence: 0.92,
    explanation: "An official source reports the same measured value.",
    independent_sources: 1,
    evidence: [
      {
        id: "web-1",
        title: "Official data",
        url: "https://agency.gov/data",
        quality_label: "primary or official source",
        quality_score: 0.91,
      },
    ],
  },
];

test("renders verdict evidence and dispatches timestamp seeks", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const seek = jest.fn();
  window.addEventListener(YOUTUBE_SEEK_EVENT, seek);

  act(() => {
    root.render(
      <FactCheckPanel
        factChecks={checks}
        videoId="dQw4w9WgXcQ"
        credibility={{
          label: "High evidence alignment",
          alignment_score: 92,
          summary: "Most assessed claims aligned with available evidence.",
          counts: {
            supported: 1,
            contradicted: 0,
            misleading: 0,
            unverified: 0,
          },
          disclaimer: "This is not proof of creator trustworthiness.",
        }}
      />
    );
  });

  expect(host.textContent).toContain("Supported");
  expect(host.textContent).toContain("92% evidence alignment");
  expect(host.textContent).toContain("92% confidence");
  const timestamp = host.querySelector('[aria-label="Play video at 00:15"]');
  act(() => {
    timestamp.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(seek).toHaveBeenCalledTimes(1);
  expect(seek.mock.calls[0][0].detail).toEqual({
    videoId: "dQw4w9WgXcQ",
    seconds: 15,
  });

  window.removeEventListener(YOUTUBE_SEEK_EVENT, seek);
  act(() => root.unmount());
  host.remove();
});
