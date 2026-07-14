"use client";

import { useEffect } from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("San OS global rendering error");
  }, []);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "#08090d", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "24px", textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <p style={{ color: "#8586ff", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 11 }}>San OS</p>
            <h1 style={{ fontSize: 28, letterSpacing: "-.04em" }}>Your workspace needs a refresh.</h1>
            <p style={{ color: "#92939d", lineHeight: 1.6 }}>The app could not finish loading this view. Try again, or return to the San OS home page.</p>
            <button onClick={() => reset()} style={{ marginTop: 16, cursor: "pointer", border: 0, borderRadius: 999, background: "#8586ff", color: "white", padding: "12px 18px", fontWeight: 700 }}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
