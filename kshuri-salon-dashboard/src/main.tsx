import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";
import { initSentry, ErrorBoundary } from "@kshuri/observability";
import { I18nProvider } from "./i18n";

initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: (import.meta.env.MODE === "production" ? "production" : "staging") as "production" | "staging",
  release: import.meta.env.VITE_RELEASE,
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
