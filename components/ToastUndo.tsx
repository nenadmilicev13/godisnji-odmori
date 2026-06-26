"use client";

import { useStore } from "@/lib/store";

export default function ToastUndo() {
  const { nedavnoObrisan, vratiZahtev, zatvoriUndo } = useStore();
  if (!nedavnoObrisan) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg animate-fade-in">
      <span>Zahtev obrisan.</span>
      <button
        onClick={() => vratiZahtev(nedavnoObrisan)}
        className="font-semibold text-brand-300 hover:text-brand-200"
      >
        Vrati
      </button>
      <button
        onClick={zatvoriUndo}
        className="text-slate-400 hover:text-white"
        aria-label="Zatvori"
      >
        ✕
      </button>
    </div>
  );
}
