"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Uloga, ULOGA_LABELE, jeAdmin } from "@/lib/types";
import { iskorisceniGodisnji } from "@/lib/utils";
import Modal from "./Modal";

export default function ZaposleniLista() {
  const {
    zaposleni,
    zahtevi,
    trenutniKorisnik,
    dodajZaposlenog,
    obrisiZaposlenog,
  } = useStore();
  const admin = jeAdmin(trenutniKorisnik);
  const [otvoren, setOtvoren] = useState(false);
  const [ime, setIme] = useState("");
  const [pozicija, setPozicija] = useState("");
  const [email, setEmail] = useState("");
  const [uloga, setUloga] = useState<Uloga>("ostalo");
  const [dani, setDani] = useState(20);
  const [greska, setGreska] = useState("");

  async function dodaj(e: React.FormEvent) {
    e.preventDefault();
    if (!ime.trim()) return;
    const g = await dodajZaposlenog({
      ime: ime.trim(),
      pozicija: pozicija.trim(),
      email: email.trim(),
      uloga,
      brojDanaGodisnjeg: dani,
    });
    if (g) return setGreska(g);
    setIme("");
    setPozicija("");
    setEmail("");
    setUloga("ostalo");
    setDani(20);
    setGreska("");
    setOtvoren(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Zaposleni</h2>
        {admin && (
          <button className="btn-primary" onClick={() => setOtvoren(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Dodaj zaposlenog
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zaposleni.map((z) => {
          const iskorisceno = iskorisceniGodisnji(zahtevi, z.id);
          const preostalo = z.brojDanaGodisnjeg - iskorisceno;
          const procenat = Math.min(
            100,
            Math.round((iskorisceno / z.brojDanaGodisnjeg) * 100) || 0,
          );
          return (
            <div key={z.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                    {z.ime
                      .split(" ")
                      .map((d) => d[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{z.ime}</p>
                    <p className="text-sm text-slate-500">{z.pozicija}</p>
                    {z.uloga === "dizajner" && (
                      <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {ULOGA_LABELE[z.uloga]}
                      </span>
                    )}
                  </div>
                </div>
                {admin && (
                  <button
                    onClick={async () => setGreska((await obrisiZaposlenog(z.id)) ?? "")}
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-rose-600"
                    aria-label="Obriši"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-slate-500">Iskorišćeno</span>
                  <span className="font-medium text-slate-700">
                    {iskorisceno} / {z.brojDanaGodisnjeg} dana
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${procenat}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Preostalo {preostalo} dana godišnjeg odmora
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        otvoren={otvoren}
        naslov="Novi zaposleni"
        onZatvori={() => setOtvoren(false)}
      >
        <form onSubmit={dodaj} className="space-y-4">
          <div>
            <label className="label">Ime i prezime</label>
            <input
              className="input"
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              placeholder="npr. Petar Petrović"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Pozicija</label>
            <input
              className="input"
              value={pozicija}
              onChange={(e) => setPozicija(e.target.value)}
              placeholder="npr. Backend developer"
            />
          </div>
          <div>
            <label className="label">Uloga</label>
            <select
              className="input"
              value={uloga}
              onChange={(e) => setUloga(e.target.value as Uloga)}
            >
              {Object.entries(ULOGA_LABELE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Dva dizajnera ne mogu biti na odsustvu u isto vreme.
            </p>
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ime@firma.rs"
            />
          </div>
          <div>
            <label className="label">Broj dana godišnjeg odmora</label>
            <input
              type="number"
              min={0}
              max={40}
              className="input"
              value={dani}
              onChange={(e) => setDani(Number(e.target.value))}
            />
          </div>
          {greska && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {greska}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setOtvoren(false)}
            >
              Otkaži
            </button>
            <button type="submit" className="btn-primary">
              Dodaj
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
