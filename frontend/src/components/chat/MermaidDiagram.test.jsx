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
