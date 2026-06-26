"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { StatusZahteva, STATUS_LABELE, TIP_LABELE } from "@/lib/types";
import { brojRadnihDana } from "@/lib/utils";
import { nazivPraznika } from "@/lib/praznici";

const LEVO = 208; // širina leve kolone (zaposleni)
const SIRINA_DANA = 40; // px po danu
const BROJ_DANA = 35; // koliko dana se prikazuje u prozoru
const VISINA_REDA = 56;

const MESECI = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];

const BOJA_STATUSA: Record<StatusZahteva, string> = {
  odobreno: "bg-brand-500",
  na_cekanju: "bg-amber-400",
  odbijeno: "bg-rose-400",
};

const BOJE_AVATARA = [
  "bg-brand-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  "bg-sky-500", "bg-violet-500", "bg-orange-500", "bg-teal-500",
];

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dan = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dan}`;
}

function parseIso(s: string): Date {
  const [g, m, d] = s.split("-").map(Number);
  return new Date(g, m - 1, d);
}

/** Razlika u danima (bIso - aIso). */
function razlikaDana(aIso: string, bIso: string): number {
  return Math.round(
    (parseIso(bIso).getTime() - parseIso(aIso).getTime()) / 86400000,
  );
}

export default function Kalendar() {
  const { zaposleni, zahtevi } = useStore();
  const danasIso = iso(new Date());

  // Početak prozora: 6 dana pre danas.
  const [pocetakIso, setPocetakIso] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return iso(d);
  });
  const [pretraga, setPretraga] = useState("");
  const [statusFilter, setStatusFilter] = useState<"sve" | StatusZahteva>("sve");

  // Niz dana u prozoru.
  const dani = useMemo(() => {
    const start = parseIso(pocetakIso);
    return Array.from({ length: BROJ_DANA }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [pocetakIso]);

  function pomeri(delta: number) {
    const d = parseIso(pocetakIso);
    d.setDate(d.getDate() + delta);
    setPocetakIso(iso(d));
  }
  function naDanas() {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    setPocetakIso(iso(d));
  }

  const filtriraniZaposleni = zaposleni.filter((z) =>
    z.ime.toLowerCase().includes(pretraga.trim().toLowerCase()),
  );

  const sirinaOse = BROJ_DANA * SIRINA_DANA;

  // Oznake meseca: gde u prozoru počinje novi mesec (ili prvi dan).
  const oznakeMeseca = dani
    .map((d, i) => ({ d, i }))
    .filter(({ d, i }) => i === 0 || d.getDate() === 1)
    .map(({ d, i }) => ({
      labela: `${MESECI[d.getMonth()]} ${d.getFullYear()}`,
      levo: i * SIRINA_DANA,
    }));

  return (
    <div className="card overflow-hidden">
      {/* Alatna traka */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
        <input
          className="input h-9 w-48 py-1.5 text-sm"
          placeholder="Pretraži zaposlene..."
          value={pretraga}
          onChange={(e) => setPretraga(e.target.value)}
        />
        <select
          className="input h-9 w-36 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="sve">Svi statusi</option>
          <option value="odobreno">{STATUS_LABELE.odobreno}</option>
          <option value="na_cekanju">{STATUS_LABELE.na_cekanju}</option>
          <option value="odbijeno">{STATUS_LABELE.odbijeno}</option>
        </select>

        <div className="ml-auto flex items-center gap-3">
          {(["odobreno", "na_cekanju", "odbijeno"] as StatusZahteva[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${BOJA_STATUSA[s]}`} />
              {STATUS_LABELE[s]}
            </span>
          ))}
          <div className="flex items-center gap-1 pl-2">
            <button onClick={naDanas} className="btn-ghost px-2 py-1 text-xs">Danas</button>
            <button onClick={() => pomeri(-14)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Nazad">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button onClick={() => pomeri(14)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Napred">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEVO + sirinaOse }}>
          {/* Zaglavlje: meseci + dani */}
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
            {/* Meseci */}
            <div className="relative h-6" style={{ marginLeft: LEVO }}>
              {oznakeMeseca.map((o) => (
                <span
                  key={o.labela + o.levo}
                  className="absolute top-1 text-xs font-semibold text-slate-600"
                  style={{ left: o.levo + 4 }}
                >
                  {o.labela}
                </span>
              ))}
            </div>
            {/* Dani */}
            <div className="flex">
              <div
                className="sticky left-0 z-10 shrink-0 bg-white"
                style={{ width: LEVO }}
              />
              {dani.map((d, i) => {
                const dan = d.getDay();
                const vikend = dan === 0 || dan === 6;
                const praznik = !!nazivPraznika(iso(d));
                const jeDanas = iso(d) === danasIso;
                return (
                  <div
                    key={i}
                    className={`shrink-0 py-1 text-center text-xs ${
                      vikend || praznik ? "bg-slate-50 text-slate-400" : "text-slate-500"
                    }`}
                    style={{ width: SIRINA_DANA }}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        jeDanas ? "bg-brand-600 font-semibold text-white" : ""
                      } ${praznik && !jeDanas ? "text-amber-500" : ""}`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redovi po zaposlenom */}
          {filtriraniZaposleni.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Nema zaposlenih za „{pretraga}“.
            </div>
          ) : (
            filtriraniZaposleni.map((z, idx) => {
              const inicijali = z.ime.split(" ").map((d) => d[0]).slice(0, 2).join("");
              const trake = zahtevi
                .filter((r) => r.zaposleniId === z.id)
                .filter((r) => statusFilter === "sve" || r.status === statusFilter)
                .map((r) => {
                  const start = Math.max(0, razlikaDana(pocetakIso, r.datumOd));
                  const krajExcl = Math.min(
                    BROJ_DANA,
                    razlikaDana(pocetakIso, r.datumDo) + 1,
                  );
                  if (krajExcl <= 0 || start >= BROJ_DANA || krajExcl <= start)
                    return null;
                  return {
                    r,
                    levo: start * SIRINA_DANA,
                    sirina: (krajExcl - start) * SIRINA_DANA,
                    dana: brojRadnihDana(r.datumOd, r.datumDo),
                  };
                })
                .filter(Boolean) as {
                  r: (typeof zahtevi)[number];
                  levo: number;
                  sirina: number;
                  dana: number;
                }[];

              return (
                <div key={z.id} className="flex border-b border-slate-100">
                  {/* Leva kolona */}
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 bg-white px-3"
                    style={{ width: LEVO, height: VISINA_REDA }}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${BOJE_AVATARA[idx % BOJE_AVATARA.length]}`}>
                      {inicijali}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{z.ime}</p>
                      <p className="truncate text-xs text-slate-400">{z.pozicija}</p>
                    </div>
                  </div>

                  {/* Vremenska osa reda */}
                  <div
                    className="relative shrink-0"
                    style={{
                      width: sirinaOse,
                      height: VISINA_REDA,
                      backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${SIRINA_DANA - 1}px, #f1f5f9 ${SIRINA_DANA - 1}px, #f1f5f9 ${SIRINA_DANA}px)`,
                    }}
                  >
                    {/* Tint za vikend/praznik */}
                    {dani.map((d, i) => {
                      const dan = d.getDay();
                      const vikend = dan === 0 || dan === 6;
                      const praznik = !!nazivPraznika(iso(d));
                      if (!vikend && !praznik) return null;
                      return (
                        <div
                          key={i}
                          className={praznik ? "absolute top-0 h-full bg-amber-50" : "absolute top-0 h-full bg-slate-50"}
                          style={{ left: i * SIRINA_DANA, width: SIRINA_DANA }}
                        />
                      );
                    })}

                    {/* Trake odsustva */}
                    {trake.map((t) => (
                      <div
                        key={t.r.id}
                        title={`${TIP_LABELE[t.r.tip]} · ${t.r.datumOd} – ${t.r.datumDo} · ${STATUS_LABELE[t.r.status]}`}
                        className={`absolute top-1/2 flex -translate-y-1/2 items-center overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm ${BOJA_STATUSA[t.r.status]}`}
                        style={{ left: t.levo + 2, width: Math.max(0, t.sirina - 4), height: 26 }}
                      >
                        {t.dana}d
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
