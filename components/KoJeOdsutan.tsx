"use client";

import { useStore } from "@/lib/store";
import { TIP_LABELE } from "@/lib/types";
import { danas, formatDatum } from "@/lib/utils";

/** Dodaje n dana ISO datumu (yyyy-mm-dd). */
function plusDana(iso: string, n: number): string {
  const [g, m, d] = iso.split("-").map(Number);
  const dt = new Date(g, m - 1, d + n);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export default function KoJeOdsutan() {
  const { zahtevi, zaposleni } = useStore();
  const danasIso = danas();
  const za7Dana = plusDana(danasIso, 7);

  const ime = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";

  const odobreni = zahtevi.filter((z) => z.status === "odobreno");

  const danasOdsutni = odobreni
    .filter((z) => z.datumOd <= danasIso && danasIso <= z.datumDo)
    .sort((a, b) => ime(a.zaposleniId).localeCompare(ime(b.zaposleniId)));

  const nadolazeci = odobreni
    .filter((z) => z.datumOd > danasIso && z.datumOd <= za7Dana)
    .sort((a, b) => a.datumOd.localeCompare(b.datumOd));

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      {/* Danas odsutni */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </span>
          <h3 className="font-semibold text-slate-900">Danas odsutni</h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {danasOdsutni.length}
          </span>
        </div>
        {danasOdsutni.length === 0 ? (
          <p className="text-sm text-slate-400">Svi su danas na poslu. ✅</p>
        ) : (
          <ul className="space-y-2">
            {danasOdsutni.map((z) => (
              <li key={z.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{ime(z.zaposleniId)}</span>
                <span className="text-slate-400">
                  {TIP_LABELE[z.tip]} · do {formatDatum(z.datumDo)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Nadolazeća odsustva (7 dana) */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <h3 className="font-semibold text-slate-900">Uskoro odsutni (7 dana)</h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {nadolazeci.length}
          </span>
        </div>
        {nadolazeci.length === 0 ? (
          <p className="text-sm text-slate-400">Nema najavljenih odsustava ove nedelje.</p>
        ) : (
          <ul className="space-y-2">
            {nadolazeci.map((z) => (
              <li key={z.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{ime(z.zaposleniId)}</span>
                <span className="text-slate-400">
                  {TIP_LABELE[z.tip]} · od {formatDatum(z.datumOd)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
