"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Zaposleni,
  TipOdsustva,
  TIP_LABELE,
  ULOGA_LABELE,
  jeAdmin,
} from "@/lib/types";
import { brojRadnihDana, formatDatum, iskorisceniGodisnji } from "@/lib/utils";
import Badge from "./Badge";

interface Props {
  zaposleni: Zaposleni;
}

/** Prikaz rođendana bez godine: dd.mm. */
function formatDanMesec(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${d}.${m}.`;
}

export default function ZaposleniProfil({ zaposleni: z }: Props) {
  const { zahtevi, trenutniKorisnik, azurirajProfil } = useStore();

  const mogeIzmena = jeAdmin(trenutniKorisnik) || trenutniKorisnik?.id === z.id;
  const [izmena, setIzmena] = useState(false);
  const [ime, setIme] = useState(z.ime);
  const [rodjendan, setRodjendan] = useState(z.rodjendan ?? "");
  const [slava, setSlava] = useState(z.slava ?? "");
  const [cuva, setCuva] = useState(false);
  const [greska, setGreska] = useState("");

  async function sacuvaj() {
    if (!ime.trim()) return setGreska("Ime i prezime ne mogu biti prazni.");
    setCuva(true);
    const g = await azurirajProfil(z.id, {
      ime: ime.trim(),
      rodjendan: rodjendan || null,
      slava: slava.trim() || null,
    });
    setCuva(false);
    if (g) return setGreska(g);
    setGreska("");
    setIzmena(false);
  }

  const moji = zahtevi
    .filter((r) => r.zaposleniId === z.id)
    .sort((a, b) => b.datumOd.localeCompare(a.datumOd));

  const iskorisceno = iskorisceniGodisnji(zahtevi, z.id);
  const preostalo = z.brojDanaGodisnjeg - iskorisceno;
  const procenat = Math.min(
    100,
    Math.round((iskorisceno / z.brojDanaGodisnjeg) * 100) || 0,
  );

  const naCekanju = moji.filter((r) => r.status === "na_cekanju").length;
  const odobreno = moji.filter((r) => r.status === "odobreno").length;

  // Odobreni dani po tipu odsustva.
  const poTipu = (Object.keys(TIP_LABELE) as TipOdsustva[])
    .map((tip) => ({
      tip,
      dana: moji
        .filter((r) => r.tip === tip && r.status === "odobreno")
        .reduce((s, r) => s + brojRadnihDana(r.datumOd, r.datumDo), 0),
    }))
    .filter((x) => x.dana > 0);

  const inicijali = (ime || z.ime)
    .split(" ")
    .map((d) => d[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="space-y-5">
      {/* Zaglavlje */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
          {inicijali}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900">{ime || z.ime}</p>
          <p className="text-sm text-slate-500">{z.pozicija}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {z.uloga === "dizajner" && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                {ULOGA_LABELE[z.uloga]}
              </span>
            )}
            <span className="text-xs text-slate-400">{z.email}</span>
          </div>
        </div>
      </div>

      {/* Rođendan i slava */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Lični datumi</h4>
          {mogeIzmena && !izmena && (
            <button
              onClick={() => setIzmena(true)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Izmeni
            </button>
          )}
        </div>

        {izmena ? (
          <div className="space-y-3">
            <div>
              <label className="label">Ime i prezime</label>
              <input
                className="input"
                value={ime}
                placeholder="npr. Petar Petrović"
                onChange={(e) => setIme(e.target.value)}
              />
            </div>
            <div>
              <label className="label">🎂 Rođendan</label>
              <input
                type="date"
                className="input"
                value={rodjendan}
                onChange={(e) => setRodjendan(e.target.value)}
              />
            </div>
            <div>
              <label className="label">🕯️ Slava</label>
              <input
                className="input"
                value={slava}
                placeholder="npr. Sveti Nikola (19.12.)"
                onChange={(e) => setSlava(e.target.value)}
              />
            </div>
            {greska && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{greska}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="btn-ghost px-3 py-1.5 text-sm"
                onClick={() => {
                  setIzmena(false);
                  setIme(z.ime);
                  setRodjendan(z.rodjendan ?? "");
                  setSlava(z.slava ?? "");
                  setGreska("");
                }}
              >
                Otkaži
              </button>
              <button className="btn-primary px-3 py-1.5 text-sm" onClick={sacuvaj} disabled={cuva}>
                {cuva ? "Čuvanje..." : "Sačuvaj"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">🎂 Rođendan</p>
              <p className="font-medium text-slate-700">{formatDanMesec(rodjendan || z.rodjendan)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">🕯️ Slava</p>
              <p className="font-medium text-slate-700">{slava || z.slava || "—"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Godišnji fond */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-slate-500">Iskorišćeno godišnjeg</span>
          <span className="font-medium text-slate-700">
            {iskorisceno} / {z.brojDanaGodisnjeg} dana
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${preostalo < 0 ? "bg-rose-500" : "bg-brand-500"}`}
            style={{ width: `${procenat}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Preostalo <span className="font-medium text-slate-600">{preostalo}</span> dana godišnjeg odmora
        </p>
      </div>

      {/* Mini statistika */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xl font-bold text-slate-900">{moji.length}</p>
          <p className="text-xs text-slate-500">Ukupno zahteva</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xl font-bold text-amber-600">{naCekanju}</p>
          <p className="text-xs text-slate-500">Na čekanju</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xl font-bold text-emerald-600">{odobreno}</p>
          <p className="text-xs text-slate-500">Odobreno</p>
        </div>
      </div>

      {/* Po tipu odsustva */}
      {poTipu.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Iskorišćeno po tipu</h4>
          <div className="space-y-1.5">
            {poTipu.map((x) => (
              <div key={x.tip} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{TIP_LABELE[x.tip]}</span>
                <span className="font-medium text-slate-700">{x.dana} dana</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Istorija zahteva */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Istorija zahteva</h4>
        {moji.length === 0 ? (
          <p className="text-sm text-slate-400">Nema zahteva.</p>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {moji.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">{TIP_LABELE[r.tip]}</p>
                  <p className="text-xs text-slate-400">
                    {formatDatum(r.datumOd)} – {formatDatum(r.datumDo)} ·{" "}
                    {brojRadnihDana(r.datumOd, r.datumDo)} dana
                  </p>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
