import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { VerticalProvider } from "./lib/VerticalContext";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VerticalProvider>
          <App />
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#111827",
                border: "1px solid #1F2937",
                color: "#F9FAFB",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
              },
            }}
          />
        </VerticalProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
