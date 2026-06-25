import { act } from "react";
import { createRoot } from "react-dom/client";

import ImageAuthenticityPanel from "./ImageAuthenticityPanel";

global.IS_REACT_ACT_ENVIRONMENT = true;

test("renders calibrated image authenticity evidence and source links", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  act(() => {
    root.render(
      <ImageAuthenticityPanel
        assessment={{
          label: "possibly_manipulated",
          confidence: 0.68,
          summary: "Localized editing indicators require caution.",
          visual_signals: ["Lighting changes around the foreground object."],
          provenance_signals: ["Editing software is recorded in EXIF."],
          metadata: {
            format: "JPEG",
            width: 1200,
            height: 800,
            camera_make: "Example",
            camera_model: "Camera",
            software: "Editor",
            exif_present: true,
            content_credentials_present: false,
          },
          source_matches: [
            {
              title: "Original publication",
              url: "https://example.com/original",
            },
          ],
          reverse_search_performed: false,
          limitations: ["This screening is not definitive."],
          method: "metadata + visual screening + text-based source corroboration",
        }}
      />
    );
  });

  expect(host.textContent).toContain("Possibly manipulated");
  expect(host.textContent).toContain("68% confidence");
  expect(host.textContent).toContain("Lighting changes");
  const link = host.querySelector('a[href="https://example.com/original"]');
  expect(link).not.toBeNull();
  expect(link.getAttribute("target")).toBe("_blank");

  act(() => root.unmount());
  host.remove();
});
