"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { TIP_LABELE, ZahtevZaOdsustvo } from "@/lib/types";
import { brojRadnihDana, danas, formatDatum } from "@/lib/utils";

/** Dodaje n dana ISO datumu (yyyy-mm-dd). */
function plusDana(iso: string, n: number): string {
  const [g, m, d] = iso.split("-").map(Number);
  const dt = new Date(g, m - 1, d + n);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/** Jedan red u listi — klik otvara detalje odsustva. */
function Stavka({
  z,
  ime,
  desno,
  otvoren,
  onKlik,
}: {
  z: ZahtevZaOdsustvo;
  ime: string;
  desno: string;
  otvoren: boolean;
  onKlik: () => void;
}) {
  const dana = brojRadnihDana(z.datumOd, z.datumDo);

  return (
    <li>
      <button
        onClick={onKlik}
        aria-expanded={otvoren}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-slate-300 transition-transform ${otvoren ? "rotate-90" : ""}`}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="truncate font-medium text-slate-700">{ime}</span>
        </span>
        <span className="shrink-0 text-slate-400">{desno}</span>
      </button>

      {otvoren && (
        <div className="ml-[1.4rem] mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <p className="font-medium text-slate-700">
            {dana} {dana === 1 ? "radni dan" : "radnih dana"}
          </p>
          <p className="mt-0.5 text-slate-500">
            {TIP_LABELE[z.tip]} · {formatDatum(z.datumOd)} – {formatDatum(z.datumDo)}
          </p>
          {z.napomena && (
            <p className="mt-1 text-slate-400">„{z.napomena}"</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function KoJeOdsutan() {
  const { zahtevi, zaposleni } = useStore();
  const [otvoren, setOtvoren] = useState<string | null>(null);
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
          <ul className="space-y-1">
            {danasOdsutni.map((z) => (
              <Stavka
                key={z.id}
                z={z}
                ime={ime(z.zaposleniId)}
                desno={`${TIP_LABELE[z.tip]} · do ${formatDatum(z.datumDo)}`}
                otvoren={otvoren === z.id}
                onKlik={() => setOtvoren(otvoren === z.id ? null : z.id)}
              />
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
          <ul className="space-y-1">
            {nadolazeci.map((z) => (
              <Stavka
                key={z.id}
                z={z}
                ime={ime(z.zaposleniId)}
                desno={`${TIP_LABELE[z.tip]} · od ${formatDatum(z.datumOd)}`}
                otvoren={otvoren === z.id}
                onKlik={() => setOtvoren(otvoren === z.id ? null : z.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
