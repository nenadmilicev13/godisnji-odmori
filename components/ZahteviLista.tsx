"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  StatusZahteva,
  ZahtevZaOdsustvo,
  TIP_LABELE,
  STATUS_LABELE,
} from "@/lib/types";
import {
  brojRadnihDana,
  formatDatum,
  pronadjiKonfliktDizajnera,
} from "@/lib/utils";
import Badge from "./Badge";

type Filter = "sve" | StatusZahteva;

export default function ZahteviLista() {
  const { zahtevi, zaposleni, promeniStatus, obrisiZahtev } = useStore();
  const [filter, setFilter] = useState<Filter>("sve");
  const [greska, setGreska] = useState("");

  const imeZaposlenog = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";

  function odobri(z: ZahtevZaOdsustvo) {
    // Pri odobravanju se kao zauzet period računaju samo već odobrena
    // odsustva drugih dizajnera.
    const konflikt = pronadjiKonfliktDizajnera(
      zahtevi,
      zaposleni,
      {
        zaposleniId: z.zaposleniId,
        datumOd: z.datumOd,
        datumDo: z.datumDo,
        ignorirajZahtevId: z.id,
      },
      ["odobreno"],
    );
    if (konflikt) {
      setGreska(
        `Ne može se odobriti: ${konflikt.zaposleni.ime} već ima odobreno odsustvo ` +
          `u periodu ${formatDatum(konflikt.zahtev.datumOd)} – ` +
          `${formatDatum(konflikt.zahtev.datumDo)}. Dva dizajnera ne mogu biti odsutna istovremeno.`,
      );
      return;
    }
    setGreska("");
    promeniStatus(z.id, "odobreno");
  }

  const filtrirani =
    filter === "sve" ? zahtevi : zahtevi.filter((z) => z.status === filter);

  const filteri: Filter[] = ["sve", "na_cekanju", "odobreno", "odbijeno"];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
        {filteri.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "sve" ? "Svi zahtevi" : STATUS_LABELE[f]}
          </button>
        ))}
      </div>

      {greska && (
        <div className="flex items-start justify-between gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{greska}</span>
          <button
            onClick={() => setGreska("")}
            className="shrink-0 font-medium text-rose-500 hover:text-rose-700"
            aria-label="Zatvori"
          >
            ✕
          </button>
        </div>
      )}

      {filtrirani.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Nema zahteva</p>
          <p className="text-sm text-slate-400">
            Dodajte novi zahtev za odsustvo da biste počeli.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtrirani.map((z) => (
            <div
              key={z.id}
              className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {imeZaposlenog(z.zaposleniId)}
                  </span>
                  <Badge status={z.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {TIP_LABELE[z.tip]} · {formatDatum(z.datumOd)} –{" "}
                  {formatDatum(z.datumDo)} ·{" "}
                  <span className="font-medium text-slate-600">
                    {brojRadnihDana(z.datumOd, z.datumDo)} dana
                  </span>
                </p>
                {z.napomena && (
                  <p className="mt-1 truncate text-sm text-slate-400">
                    „{z.napomena}“
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {z.status !== "odobreno" && (
                  <button
                    onClick={() => odobri(z)}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Odobri
                  </button>
                )}
                {z.status !== "odbijeno" && (
                  <button
                    onClick={() => promeniStatus(z.id, "odbijeno")}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    Odbij
                  </button>
                )}
                <button
                  onClick={() => obrisiZahtev(z.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                  aria-label="Obriši"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
