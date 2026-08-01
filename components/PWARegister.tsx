"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Only register service worker in production mode to avoid dev HMR loop issues
    if (process.env.NODE_ENV !== "production") {
      console.log("PWA Service Worker registration skipped in development mode.");
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA Service Worker registered with scope: ", registration.scope);
        })
        .catch((err) => {
          console.error("PWA Service Worker registration failed: ", err);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
