"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatDatum } from "@/lib/utils";

export default function Zvonce() {
  const { notifikacije, oznaciNotifikacijeProcitane } = useStore();
  const [otvoren, setOtvoren] = useState(false);
  const nepročitano = notifikacije.filter((n) => !n.procitano).length;

  function prebaci() {
    const novo = !otvoren;
    setOtvoren(novo);
    if (novo && nepročitano > 0) oznaciNotifikacijeProcitane();
  }

  return (
    <div className="relative">
      <button
        onClick={prebaci}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
        aria-label="Notifikacije"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {nepročitano > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {nepročitano > 9 ? "9+" : nepročitano}
          </span>
        )}
      </button>

      {otvoren && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOtvoren(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Obaveštenja
            </div>
            {notifikacije.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Nema obaveštenja.
              </p>
            ) : (
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {notifikacije.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <p className="text-sm text-slate-700">{n.tekst}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDatum(n.kreirano)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
