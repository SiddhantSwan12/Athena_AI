import { act } from "react";
import { createRoot } from "react-dom/client";
import mermaid from "mermaid";

import MermaidDiagram from "./MermaidDiagram";

jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    parse: jest.fn(),
    render: jest.fn(),
  },
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("invalid diagrams stay contained and do not render Mermaid error SVGs", async () => {
  mermaid.parse.mockResolvedValue(false);
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(
      <MermaidDiagram
        code={"flowchart TD\nA[Broken"}
        accent="#6B5BFF"
      />
    );
  });

  expect(host.textContent).toContain("Diagram preview unavailable");
  expect(mermaid.render).not.toHaveBeenCalled();
  expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);

  act(() => root.unmount());
  host.remove();
});

test("valid diagrams open in an enlarged zoomable viewer", async () => {
  mermaid.parse.mockResolvedValue(true);
  mermaid.render.mockResolvedValue({
    svg: '<svg viewBox="0 0 1200 800"><g class="node"><rect /></g></svg>',
  });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(
      <MermaidDiagram
        code={"flowchart TD\nA[Start] --> B[Finish]"}
        accent="#6B5BFF"
      />
    );
  });

  const preview = host.querySelector('[data-testid="mermaid-preview"]');
  expect(preview).not.toBeNull();

  act(() => {
    preview.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const viewer = document.body.querySelector('[data-testid="mermaid-viewer"]');
  expect(viewer).not.toBeNull();
  expect(viewer.textContent).toContain("100%");

  const zoomIn = viewer.querySelector('[aria-label="Zoom in"]');
  act(() => {
    zoomIn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(viewer.textContent).toContain("120%");

  const close = viewer.querySelector('[aria-label="Close diagram viewer"]');
  act(() => {
    close.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(document.body.querySelector('[data-testid="mermaid-viewer"]')).toBeNull();

  act(() => root.unmount());
  host.remove();
});
