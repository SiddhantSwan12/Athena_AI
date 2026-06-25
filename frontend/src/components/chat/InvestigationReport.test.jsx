import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

import InvestigationReport from "./InvestigationReport";

global.IS_REACT_ACT_ENVIRONMENT = true;

test("renders a unified investigation summary and report link", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  act(() => {
    root.render(
      <MemoryRouter>
        <InvestigationReport
          investigation={{
            id: "investigation-1",
            input_type: "youtube",
            overall_label: "claims_contradicted",
            confidence: 0.92,
            summary: "One checked claim was contradicted.",
            claims: [
              {
                id: "claim-1",
                claim: "The product does not exist.",
                verdict: "contradicted",
                explanation: "The official announcement confirms it exists.",
              },
            ],
            evidence: [{ title: "Official announcement" }],
            limitations: ["Only public evidence was checked."],
          }}
        />
      </MemoryRouter>
    );
  });

  expect(host.textContent).toContain("Claims contradicted");
  expect(host.textContent).toContain("92% confidence");
  expect(host.textContent).toContain("The product does not exist.");
  expect(
    host.querySelector('a[href="/investigations/investigation-1"]')
  ).not.toBeNull();

  act(() => root.unmount());
  host.remove();
});
