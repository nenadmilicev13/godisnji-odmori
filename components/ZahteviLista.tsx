"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  StatusZahteva,
  ZahtevZaOdsustvo,
  TipOdsustva,
  TIP_LABELE,
  STATUS_LABELE,
  jeAdmin,
  tipoviZaUnos,
} from "@/lib/types";
import { brojRadnihDana, formatDatum } from "@/lib/utils";
import Badge from "./Badge";
import Modal from "./Modal";

type Filter = "sve" | StatusZahteva;

const PO_STRANI = 10;

export default function ZahteviLista() {
  const {
    zahtevi,
    zaposleni,
    trenutniKorisnik,
    promeniStatus,
    izmeniZahtev,
    obrisiZahtev,
  } = useStore();
  const [filter, setFilter] = useState<Filter>("sve");
  const [strana, setStrana] = useState(1);
  const [greska, setGreska] = useState("");

  // Izmena (samo dok je „na čekanju")
  const [izmena, setIzmena] = useState<ZahtevZaOdsustvo | null>(null);
  const [tip, setTip] = useState<TipOdsustva>("godisnji");
  const [datumOd, setDatumOd] = useState("");
  const [datumDo, setDatumDo] = useState("");
  const [napomena, setNapomena] = useState("");
  const [cuva, setCuva] = useState(false);
  const [greskaIzmena, setGreskaIzmena] = useState("");

  const admin = jeAdmin(trenutniKorisnik);

  const imeZaposlenog = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";

  async function postaviStatus(z: ZahtevZaOdsustvo, status: StatusZahteva) {
    const g = await promeniStatus(z.id, status);
    setGreska(g ?? "");
  }

  async function ukloni(z: ZahtevZaOdsustvo) {
    const g = await obrisiZahtev(z.id);
    setGreska(g ?? "");
  }

  function otvoriIzmenu(z: ZahtevZaOdsustvo) {
    setIzmena(z);
    setTip(z.tip);
    setDatumOd(z.datumOd);
    setDatumDo(z.datumDo);
    setNapomena(z.napomena);
    setGreskaIzmena("");
  }

  async function sacuvajIzmenu() {
    if (!izmena) return;
    if (new Date(datumOd) > new Date(datumDo))
      return setGreskaIzmena("Datum „od“ ne može biti posle datuma „do“.");
    setCuva(true);
    const g = await izmeniZahtev(izmena.id, { tip, datumOd, datumDo, napomena });
    setCuva(false);
    if (g) return setGreskaIzmena(g);
    setIzmena(null);
  }

  // Radnik vidi samo svoje zahteve; admin vidi sve.
  const vidljivi = admin
    ? zahtevi
    : zahtevi.filter((z) => z.zaposleniId === trenutniKorisnik?.id);

  const filtrirani =
    filter === "sve" ? vidljivi : vidljivi.filter((z) => z.status === filter);

  const filteri: Filter[] = ["sve", "na_cekanju", "odobreno", "odbijeno"];

  // Paginacija — 10 zahteva po strani.
  const ukupnoStrana = Math.max(1, Math.ceil(filtrirani.length / PO_STRANI));
  // Klamp: ako se lista skrati (brisanje, promena filtera), ostani u opsegu.
  const trenutnaStrana = Math.min(strana, ukupnoStrana);
  const prviIndeks = (trenutnaStrana - 1) * PO_STRANI;
  const naStrani = filtrirani.slice(prviIndeks, prviIndeks + PO_STRANI);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
        {filteri.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setStrana(1);
            }}
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
          {naStrani.map((z) => {
            const mojZahtev = z.zaposleniId === trenutniKorisnik?.id;
            return (
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
                  {admin && z.status !== "odobreno" && (
                    <button
                      onClick={() => postaviStatus(z, "odobreno")}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Odobri
                    </button>
                  )}
                  {admin && z.status !== "odbijeno" && (
                    <button
                      onClick={() => postaviStatus(z, "odbijeno")}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      Odbij
                    </button>
                  )}
                  {(admin || mojZahtev) && z.status === "na_cekanju" && (
                    <button
                      onClick={() => otvoriIzmenu(z)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      Izmeni
                    </button>
                  )}
                  {(admin || (mojZahtev && z.status === "na_cekanju")) && (
                    <button
                      onClick={() => ukloni(z)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                      aria-label="Obriši"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ukupnoStrana > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">
            Prikazano {prviIndeks + 1}–{prviIndeks + naStrani.length} od{" "}
            {filtrirani.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStrana(trenutnaStrana - 1)}
              disabled={trenutnaStrana === 1}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Prethodna
            </button>
            {Array.from({ length: ukupnoStrana }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setStrana(n)}
                aria-current={n === trenutnaStrana ? "page" : undefined}
                className={`min-w-[2rem] rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                  n === trenutnaStrana
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setStrana(trenutnaStrana + 1)}
              disabled={trenutnaStrana === ukupnoStrana}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sledeća
            </button>
          </div>
        </div>
      )}

      {/* Izmena zahteva (samo pre odobrenja) */}
      <Modal
        otvoren={!!izmena}
        naslov="Izmena zahteva"
        onZatvori={() => setIzmena(null)}
      >
        {izmena && (
          <div className="space-y-4">
            <div>
              <label className="label">Tip odsustva</label>
              <select
                className="input"
                value={tip}
                onChange={(e) => setTip(e.target.value as TipOdsustva)}
              >
                {tipoviZaUnos(admin).map((k) => (
                  <option key={k} value={k}>
                    {TIP_LABELE[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Datum od</label>
                <input
                  type="date"
                  className="input"
                  value={datumOd}
                  onChange={(e) => setDatumOd(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Datum do</label>
                <input
                  type="date"
                  className="input"
                  value={datumDo}
                  min={datumOd}
                  onChange={(e) => setDatumDo(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
              Trajanje:{" "}
              <span className="font-semibold">
                {brojRadnihDana(datumOd, datumDo)} radnih dana
              </span>{" "}
              <span className="text-brand-400">(bez vikenda i praznika)</span>
            </div>
            <div>
              <label className="label">Napomena</label>
              <textarea
                className="input min-h-[70px] resize-y"
                value={napomena}
                onChange={(e) => setNapomena(e.target.value)}
              />
            </div>
            {greskaIzmena && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {greskaIzmena}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button className="btn-ghost" onClick={() => setIzmena(null)}>
                Otkaži
              </button>
              <button
                className="btn-primary"
                onClick={sacuvajIzmenu}
                disabled={cuva}
              >
                {cuva ? "Čuvanje..." : "Sačuvaj izmene"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
