"use client";

import { useStore } from "@/lib/store";
import { brojRadnihDanaUGodini, preneseniDani } from "@/lib/utils";

/**
 * Nalozi kojima se kartica ne prikazuje. Vezano za konkretan nalog, a ne za
 * ulogu — jer i neko sa admin pravima (npr. Nenad) treba da prati svoj fond.
 * Ako se šef promeni, izmeni ovu listu.
 */
const BEZ_KARTICE = ["sava.marinkovic@baseline.rs"];

/**
 * Lični pregled godišnjeg fonda za tekuću godinu — koliko je dana potrošeno,
 * koliko čeka odobrenje i koliko ostaje.
 */
export default function MojFond() {
  const { zahtevi, trenutniKorisnik } = useStore();
  if (!trenutniKorisnik) return null;
  if (BEZ_KARTICE.includes(trenutniKorisnik.email.toLowerCase())) return null;

  const godina = new Date().getFullYear();

  const moji = zahtevi.filter(
    (z) => z.zaposleniId === trenutniKorisnik.id && z.tip === "godisnji",
  );
  const dana = (z: (typeof moji)[number]) =>
    brojRadnihDanaUGodini(z.datumOd, z.datumDo, godina);

  const odobreno = moji
    .filter((z) => z.status === "odobreno")
    .reduce((s, z) => s + dana(z), 0);
  const naCekanju = moji
    .filter((z) => z.status === "na_cekanju")
    .reduce((s, z) => s + dana(z), 0);

  const preneseno = preneseniDani(zahtevi, trenutniKorisnik, godina);
  const fond = trenutniKorisnik.brojDanaGodisnjeg + preneseno;
  const zauzeto = odobreno + naCekanju;
  const preostalo = Math.max(0, fond - zauzeto);

  const pct = (n: number) => (fond > 0 ? Math.min(100, (n / fond) * 100) : 0);

  // Sick leave ima svoj, odvojen fond.
  const sickLeave = zahtevi.filter(
    (z) =>
      z.zaposleniId === trenutniKorisnik.id &&
      z.tip === "sick_leave" &&
      z.status !== "odbijeno",
  );
  const fondSL = trenutniKorisnik.brojDanaSickLeave;
  const iskorisceniSL = sickLeave.reduce(
    (s, z) => s + brojRadnihDanaUGodini(z.datumOd, z.datumDo, godina),
    0,
  );
  const preostaloSL = Math.max(0, fondSL - iskorisceniSL);
  const pctSL = fondSL > 0 ? Math.min(100, (iskorisceniSL / fondSL) * 100) : 0;

  return (
    <div className="card mb-8 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
        <h3 className="font-semibold text-slate-900">
          Moj godišnji odmor ({godina})
        </h3>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {odobreno}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Potrošeno dana
          </p>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-brand-600">
            {preostalo}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Preostalo dana
          </p>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-slate-400">
            {fond}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Ukupan fond
          </p>
          {preneseno > 0 && (
            <p className="mt-0.5 text-[11px] text-brand-600">
              +{preneseno} preneseno, do 30.06.
            </p>
          )}
        </div>
      </div>

      {/* Traka: odobreno (puno) + na čekanju (šrafirano) */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="bg-brand-500 transition-all"
          style={{ width: `${pct(odobreno)}%` }}
        />
        <div
          className="bg-amber-300 transition-all"
          style={{ width: `${pct(naCekanju)}%` }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Odobreno: {odobreno}
        </span>
        {naCekanju > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Čeka odobrenje: {naCekanju}
          </span>
        )}
        {preostalo === 0 && (
          <span className="font-medium text-rose-600">
            Iskoristio si ceo fond za {godina}.
          </span>
        )}
      </div>

      {/* Sick leave — odvojen fond */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            🤒 Sick leave
          </span>
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{iskorisceniSL}</span>{" "}
            / {fondSL} dana ·{" "}
            <span className="font-semibold text-slate-800">{preostaloSL}</span>{" "}
            preostalo
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${pctSL}%` }}
          />
        </div>
      </div>
    </div>
  );
}
