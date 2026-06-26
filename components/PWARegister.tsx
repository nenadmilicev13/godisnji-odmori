"use client";

import { useEffect } from "react";

/** Registruje service worker (za instalaciju na telefonu / offline). */
export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
