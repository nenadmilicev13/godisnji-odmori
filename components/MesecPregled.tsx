"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  StatusZahteva,
  ZahtevZaOdsustvo,
  TIP_LABELE,
  jeAdmin,
} from "@/lib/types";
import { brojRadnihDana, formatDatum } from "@/lib/utils";
import { nazivPraznika } from "@/lib/praznici";
import Modal from "./Modal";
import Badge from "./Badge";

const DANI = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
const MESECI = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];

const BOJA: Record<StatusZahteva, string> = {
  odobreno: "bg-emerald-100 text-emerald-800",
  na_cekanju: "bg-amber-100 text-amber-800",
  odbijeno: "bg-slate-100 text-slate-400",
};

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dan = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dan}`;
}
function parseIso(s: string): Date {
  const [g, m, d] = s.split("-").map(Number);
  return new Date(g, m - 1, d);
}
function jednakDan(a: Date, b: Date) {
  return iso(a) === iso(b);
}
function prviDan(ime: string) {
  return ime.split(" ")[0];
}

export default function MesecPregled() {
  const { zahtevi, zaposleni, trenutniKorisnik, promeniStatus, obrisiZahtev } =
    useStore();
  const admin = jeAdmin(trenutniKorisnik);
  const danasnji = new Date();
  const [godina, setGodina] = useState(danasnji.getFullYear());
  const [mesec, setMesec] = useState(danasnji.getMonth());
  const [detalj, setDetalj] = useState<ZahtevZaOdsustvo | null>(null);
  const [poruka, setPoruka] = useState("");

  const ime = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";
  const uloga = (id: string) => zaposleni.find((z) => z.id === id)?.uloga;

  const dani = useMemo(() => {
    const prvi = new Date(godina, mesec, 1);
    const pomak = (prvi.getDay() + 6) % 7; // pon = 0
    const start = new Date(godina, mesec, 1 - pomak);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [godina, mesec]);

  function odsustvaZaDan(dan: Date) {
    return zahtevi
      .filter((z) => {
        if (z.status === "odbijeno") return false;
        return dan >= parseIso(z.datumOd) && dan <= parseIso(z.datumDo);
      })
      .sort((a, b) => ime(a.zaposleniId).localeCompare(ime(b.zaposleniId)));
  }

  function promeniMesec(delta: number) {
    const n = new Date(godina, mesec + delta, 1);
    setGodina(n.getFullYear());
    setMesec(n.getMonth());
  }
  function naDanas() {
    setGodina(danasnji.getFullYear());
    setMesec(danasnji.getMonth());
  }
  async function akcija(fn: () => Promise<string | null>) {
    const g = await fn();
    setDetalj(null);
    setPoruka(g ?? "");
  }

  return (
    <div className="card overflow-hidden">
      {/* Navigacija */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {MESECI[mesec]} {godina}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={naDanas} className="btn-ghost px-3 py-1.5 text-sm">Danas</button>
          <button onClick={() => promeniMesec(-1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Prethodni">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button onClick={() => promeniMesec(1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Sledeći">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {poruka && (
        <div className="flex items-start justify-between gap-3 border-b border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <span>{poruka}</span>
          <button onClick={() => setPoruka("")} className="shrink-0 font-medium text-rose-500">✕</button>
        </div>
      )}

      {/* Imena dana */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DANI.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
        ))}
      </div>

      {/* Mreža */}
      <div className="grid grid-cols-7">
        {dani.map((dan, i) => {
          const uMesecu = dan.getMonth() === mesec;
          const jeDanas = jednakDan(dan, danasnji);
          const praznik = nazivPraznika(iso(dan));
          const ods = odsustvaZaDan(dan);
          const dizajnera = ods.filter((z) => uloga(z.zaposleniId) === "dizajner").length;
          const kolizija = dizajnera >= 2;
          return (
            <div
              key={i}
              className={`min-h-[92px] border-b border-r border-slate-100 p-1.5 ${
                praznik ? "bg-amber-50" : uMesecu ? "bg-white" : "bg-slate-50/60"
              } ${kolizija ? "ring-2 ring-inset ring-rose-300" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  jeDanas ? "bg-brand-600 text-white" : praznik ? "text-amber-600" : uMesecu ? "text-slate-700" : "text-slate-400"
                }`}>
                  {dan.getDate()}
                </span>
                {kolizija && <span title="2+ dizajnera" className="text-xs font-bold text-rose-500">⚠</span>}
              </div>
              {praznik && (
                <p className="mb-0.5 truncate text-[10px] font-medium text-amber-600" title={praznik}>{praznik}</p>
              )}
              <div className="space-y-0.5">
                {ods.slice(0, 3).map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setDetalj(z)}
                    title={`${ime(z.zaposleniId)} — ${TIP_LABELE[z.tip]}`}
                    className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${BOJA[z.status]} hover:brightness-95`}
                  >
                    {prviDan(ime(z.zaposleniId))}
                  </button>
                ))}
                {ods.length > 3 && (
                  <div className="px-1.5 text-[11px] text-slate-400">+{ods.length - 3} još</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalji */}
      <Modal otvoren={!!detalj} naslov="Zahtev za odsustvo" onZatvori={() => setDetalj(null)}>
        {detalj && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{ime(detalj.zaposleniId)}</span>
              <Badge status={detalj.status} />
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p><span className="text-slate-400">Tip:</span> {TIP_LABELE[detalj.tip]}</p>
              <p><span className="text-slate-400">Period:</span> {formatDatum(detalj.datumOd)} – {formatDatum(detalj.datumDo)}</p>
              <p><span className="text-slate-400">Trajanje:</span> {brojRadnihDana(detalj.datumOd, detalj.datumDo)} radnih dana</p>
              {detalj.napomena && <p className="mt-1 text-slate-500">„{detalj.napomena}“</p>}
            </div>
            {admin && (
              <div className="flex flex-wrap justify-end gap-2">
                {detalj.status !== "odobreno" && (
                  <button onClick={() => akcija(() => promeniStatus(detalj.id, "odobreno"))} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100">Odobri</button>
                )}
                {detalj.status !== "odbijeno" && (
                  <button onClick={() => akcija(() => promeniStatus(detalj.id, "odbijeno"))} className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100">Odbij</button>
                )}
                <button onClick={() => akcija(() => obrisiZahtev(detalj.id))} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200">Obriši</button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
