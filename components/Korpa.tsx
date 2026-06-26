"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { ZahtevZaOdsustvo, TIP_LABELE } from "@/lib/types";
import { formatDatum } from "@/lib/utils";
import Badge from "./Badge";

export default function Korpa() {
  const { zaposleni, vratiZahtev, trajnoObrisi } = useStore();
  const [obrisani, setObrisani] = useState<ZahtevZaOdsustvo[]>([]);
  const [ucitano, setUcitano] = useState(false);

  const ucitaj = useCallback(async () => {
    const res = await fetch("/api/zahtevi?korpa=1");
    if (res.ok) setObrisani((await res.json()).zahtevi);
    setUcitano(true);
  }, []);

  useEffect(() => {
    ucitaj();
  }, [ucitaj]);

  const ime = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";

  async function vrati(id: string) {
    await vratiZahtev(id);
    ucitaj();
  }
  async function trajno(id: string) {
    await trajnoObrisi(id);
    ucitaj();
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 p-4">
        <span className="text-slate-400">🗑️</span>
        <h2 className="font-semibold text-slate-900">Korpa (obrisani zahtevi)</h2>
      </div>

      {!ucitano ? (
        <div className="py-12 text-center text-sm text-slate-400">Učitavanje...</div>
      ) : obrisani.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-slate-600">Korpa je prazna</p>
          <p className="text-sm text-slate-400">Obrisani zahtevi se ovde čuvaju dok ih ne vratite ili trajno obrišete.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {obrisani.map((z) => (
            <div key={z.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{ime(z.zaposleniId)}</span>
                  <Badge status={z.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {TIP_LABELE[z.tip]} · {formatDatum(z.datumOd)} – {formatDatum(z.datumDo)}
                </p>
                {z.napomena && (
                  <p className="mt-1 truncate text-sm text-slate-400">„{z.napomena}“</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => vrati(z.id)}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Vrati
                </button>
                <button
                  onClick={() => trajno(z.id)}
                  className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  Trajno obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
