"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { TipOdsustva, TIP_LABELE } from "@/lib/types";

const DANI = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
const MESECI = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

// Boje po tipu odsustva (pune Tailwind klase zbog purge-a).
const BOJE: Record<TipOdsustva, { bg: string; tekst: string; tacka: string }> = {
  godisnji: { bg: "bg-emerald-100", tekst: "text-emerald-800", tacka: "bg-emerald-500" },
  bolovanje: { bg: "bg-rose-100", tekst: "text-rose-800", tacka: "bg-rose-500" },
  slobodan_dan: { bg: "bg-amber-100", tekst: "text-amber-800", tacka: "bg-amber-500" },
  placeno_odsustvo: { bg: "bg-sky-100", tekst: "text-sky-800", tacka: "bg-sky-500" },
  neplaceno_odsustvo: { bg: "bg-slate-200", tekst: "text-slate-700", tacka: "bg-slate-500" },
};

/** "yyyy-mm-dd" -> lokalni Date (bez UTC pomeraja). */
function parseLokalni(iso: string): Date {
  const [g, m, d] = iso.split("-").map(Number);
  return new Date(g, m - 1, d);
}

function jednakDan(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function prviDan(ime: string): string {
  return ime.split(" ")[0];
}

export default function Kalendar() {
  const { zahtevi, zaposleni } = useStore();
  const danasnji = new Date();
  const [godina, setGodina] = useState(danasnji.getFullYear());
  const [mesec, setMesec] = useState(danasnji.getMonth());

  const imeZaposlenog = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";
  const ulogaZaposlenog = (id: string) =>
    zaposleni.find((z) => z.id === id)?.uloga;

  // 42 ćelije (6 nedelja), počev od ponedeljka.
  const dani = useMemo(() => {
    const prvi = new Date(godina, mesec, 1);
    const pomak = (prvi.getDay() + 6) % 7; // 0 = ponedeljak
    const start = new Date(godina, mesec, 1 - pomak);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [godina, mesec]);

  // Aktivna (neodbijena) odsustva za dati dan.
  function odsustvaZaDan(dan: Date) {
    return zahtevi
      .filter((z) => {
        if (z.status === "odbijeno") return false;
        const od = parseLokalni(z.datumOd);
        const doD = parseLokalni(z.datumDo);
        return dan >= od && dan <= doD;
      })
      .sort((a, b) => imeZaposlenog(a.zaposleniId).localeCompare(imeZaposlenog(b.zaposleniId)));
  }

  function promeniMesec(delta: number) {
    const novi = new Date(godina, mesec + delta, 1);
    setGodina(novi.getFullYear());
    setMesec(novi.getMonth());
  }

  function naDanas() {
    setGodina(danasnji.getFullYear());
    setMesec(danasnji.getMonth());
  }

  return (
    <div className="card overflow-hidden">
      {/* Zaglavlje sa navigacijom */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {MESECI[mesec]} {godina}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={naDanas} className="btn-ghost px-3 py-1.5 text-sm">
            Danas
          </button>
          <button
            onClick={() => promeniMesec(-1)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Prethodni mesec"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => promeniMesec(1)}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Sledeći mesec"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-3">
        {Object.entries(TIP_LABELE).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`h-2.5 w-2.5 rounded-full ${BOJE[k as TipOdsustva].tacka}`} />
            {v}
          </span>
        ))}
      </div>

      {/* Imena dana */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DANI.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Mreža dana */}
      <div className="grid grid-cols-7">
        {dani.map((dan, i) => {
          const uMesecu = dan.getMonth() === mesec;
          const jeDanas = jednakDan(dan, danasnji);
          const odsustva = odsustvaZaDan(dan);

          // Da li ima ≥2 dizajnera odsutna istog dana (kolizija).
          const dizajneriOdsutni = odsustva.filter(
            (z) => ulogaZaposlenog(z.zaposleniId) === "dizajner",
          ).length;
          const kolizija = dizajneriOdsutni >= 2;

          return (
            <div
              key={i}
              className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 ${
                uMesecu ? "bg-white" : "bg-slate-50/60"
              } ${kolizija ? "ring-2 ring-inset ring-rose-300" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    jeDanas
                      ? "bg-brand-600 text-white"
                      : uMesecu
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {dan.getDate()}
                </span>
                {kolizija && (
                  <span
                    className="text-xs font-bold text-rose-500"
                    title="Dva ili više dizajnera odsutno istog dana"
                  >
                    ⚠
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {odsustva.slice(0, 3).map((z) => {
                  const boja = BOJE[z.tip];
                  const dizajner = ulogaZaposlenog(z.zaposleniId) === "dizajner";
                  return (
                    <div
                      key={z.id}
                      title={`${imeZaposlenog(z.zaposleniId)} — ${TIP_LABELE[z.tip]}${
                        z.status === "na_cekanju" ? " (na čekanju)" : ""
                      }`}
                      className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${boja.bg} ${boja.tekst} ${
                        z.status === "na_cekanju" ? "opacity-60" : ""
                      } ${kolizija && dizajner ? "ring-1 ring-rose-400" : ""}`}
                    >
                      {prviDan(imeZaposlenog(z.zaposleniId))}
                    </div>
                  );
                })}
                {odsustva.length > 3 && (
                  <div className="px-1.5 text-[11px] text-slate-400">
                    +{odsustva.length - 3} još
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
