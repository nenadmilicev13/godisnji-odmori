"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Avatar from "./Avatar";
import GodisnjaTraka from "./GodisnjaTraka";
import {
  Zaposleni,
  TipOdsustva,
  TIP_LABELE,
  ULOGA_LABELE,
  jeAdmin,
} from "@/lib/types";
import {
  brojRadnihDana,
  formatDatum,
  iskorisceniGodisnjiUGodini,
} from "@/lib/utils";
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
  const { zahtevi, trenutniKorisnik, azurirajProfil, promeniLozinku } = useStore();

  const jeVlasnik = trenutniKorisnik?.id === z.id;
  const mogeIzmena = jeAdmin(trenutniKorisnik) || jeVlasnik;

  // Promena lozinke
  const [lozinkaOtvorena, setLozinkaOtvorena] = useState(false);
  const [staraLozinka, setStaraLozinka] = useState("");
  const [novaLozinka, setNovaLozinka] = useState("");
  const [lozinkaPoruka, setLozinkaPoruka] = useState("");
  const [lozinkaOk, setLozinkaOk] = useState(false);
  const [cuvaLozinku, setCuvaLozinku] = useState(false);

  async function sacuvajLozinku() {
    if (novaLozinka.length < 6) {
      setLozinkaOk(false);
      return setLozinkaPoruka("Lozinka mora imati bar 6 karaktera.");
    }
    setCuvaLozinku(true);
    const g = await promeniLozinku(
      z.id,
      jeVlasnik ? { staraLozinka, novaLozinka } : { novaLozinka },
    );
    setCuvaLozinku(false);
    if (g) {
      setLozinkaOk(false);
      return setLozinkaPoruka(g);
    }
    setLozinkaOk(true);
    setLozinkaPoruka("Lozinka je promenjena.");
    setStaraLozinka("");
    setNovaLozinka("");
  }
  const [izmena, setIzmena] = useState(false);
  const [ime, setIme] = useState(z.ime);
  const [rodjendan, setRodjendan] = useState(z.rodjendan ?? "");
  const [slava, setSlava] = useState(z.slava ?? "");
  const [cuva, setCuva] = useState(false);
  const [greska, setGreska] = useState("");

  // Profilna slika
  const fileRef = useRef<HTMLInputElement>(null);
  const [slika, setSlika] = useState<string | null>(z.slika ?? null);
  const [slikaCuva, setSlikaCuva] = useState(false);

  /** Učita sliku, smanji na 256px i vrati JPEG data URL. */
  function smanjiSliku(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const vel = 256;
          const c = document.createElement("canvas");
          c.width = vel;
          c.height = vel;
          const ctx = c.getContext("2d");
          if (!ctx) return reject(new Error("canvas"));
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, vel, vel);
          resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function izaberiSliku(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSlikaCuva(true);
    try {
      const data = await smanjiSliku(file);
      const g = await azurirajProfil(z.id, { slika: data });
      if (!g) setSlika(data);
    } finally {
      setSlikaCuva(false);
    }
  }

  async function ukloniSliku() {
    setSlikaCuva(true);
    const g = await azurirajProfil(z.id, { slika: null });
    if (!g) setSlika(null);
    setSlikaCuva(false);
  }

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

  const [godina, setGodina] = useState(new Date().getFullYear());
  const iskorisceno = iskorisceniGodisnjiUGodini(zahtevi, z.id, godina);
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

  return (
    <div className="space-y-5">
      {/* Zaglavlje */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar ime={ime || z.ime} slika={slika} className="h-16 w-16 text-lg" />
          {mogeIzmena && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={slikaCuva}
              title="Promeni sliku"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow hover:bg-brand-700 disabled:opacity-60"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={izaberiSliku}
          />
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
          {mogeIzmena && slika && (
            <button
              onClick={ukloniSliku}
              disabled={slikaCuva}
              className="mt-1 text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-60"
            >
              Ukloni sliku
            </button>
          )}
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
              <label className="label">🕯️ Slava (datum)</label>
              <input
                type="date"
                className="input"
                value={slava}
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
              <p className="font-medium text-slate-700">{formatDanMesec(slava || z.slava)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Lozinka */}
      {mogeIzmena && (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">
              {jeVlasnik ? "Lozinka" : "Resetuj lozinku"}
            </h4>
            {!lozinkaOtvorena && (
              <button
                onClick={() => {
                  setLozinkaOtvorena(true);
                  setLozinkaPoruka("");
                }}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {jeVlasnik ? "Promeni lozinku" : "Postavi novu"}
              </button>
            )}
          </div>

          {lozinkaOtvorena && (
            <div className="mt-3 space-y-3">
              {jeVlasnik && (
                <div>
                  <label className="label">Trenutna lozinka</label>
                  <input
                    type="password"
                    className="input"
                    value={staraLozinka}
                    onChange={(e) => setStaraLozinka(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="label">Nova lozinka</label>
                <input
                  type="password"
                  className="input"
                  value={novaLozinka}
                  placeholder="bar 6 karaktera"
                  onChange={(e) => setNovaLozinka(e.target.value)}
                />
              </div>
              {lozinkaPoruka && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    lozinkaOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {lozinkaPoruka}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  className="btn-ghost px-3 py-1.5 text-sm"
                  onClick={() => {
                    setLozinkaOtvorena(false);
                    setStaraLozinka("");
                    setNovaLozinka("");
                    setLozinkaPoruka("");
                  }}
                >
                  Zatvori
                </button>
                <button
                  className="btn-primary px-3 py-1.5 text-sm"
                  onClick={sacuvajLozinku}
                  disabled={cuvaLozinku}
                >
                  {cuvaLozinku ? "Čuvanje..." : "Sačuvaj lozinku"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Godišnji fond (po godini) */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-slate-500">Godišnji fond za</span>
          <select
            className="input h-8 w-28 py-1 text-sm"
            value={godina}
            onChange={(e) => setGodina(Number(e.target.value))}
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i).map(
              (g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-slate-500">Iskorišćeno</span>
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

        {/* Pregled odsustava kroz izabranu godinu */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Odsustva kroz {godina}
          </p>
          <GodisnjaTraka zaposleniId={z.id} godina={godina} />
        </div>
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
