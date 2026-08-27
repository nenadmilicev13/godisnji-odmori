"use client";

import { useEffect } from "react";

type Sirina = "lg" | "xl" | "2xl" | "3xl";

const SIRINE: Record<Sirina, string> = {
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

interface Props {
  otvoren: boolean;
  naslov: string;
  onZatvori: () => void;
  children: React.ReactNode;
  /** Šira varijanta za sadržaj koji ne staje u jednu kolonu. */
  sirina?: Sirina;
}

export default function Modal({
  otvoren,
  naslov,
  onZatvori,
  children,
  sirina = "lg",
}: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onZatvori();
    };
    if (otvoren) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [otvoren, onZatvori]);

  if (!otvoren) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onZatvori}
      />
      <div
        className={`relative z-10 flex max-h-[90vh] w-full flex-col animate-scale-in card p-0 ${SIRINE[sirina]}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{naslov}</h2>
          <button
            onClick={onZatvori}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Zatvori"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
