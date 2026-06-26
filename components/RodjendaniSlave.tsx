"use client";

import { useStore } from "@/lib/store";

const MESECI = [
  "januar", "februar", "mart", "april", "maj", "jun",
  "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
];

/** Mesec (1-12) iz ISO datuma rođendana. */
function mesecRodjendana(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = Number(iso.split("-")[1]);
  return m >= 1 && m <= 12 ? m : null;
}

/** Dan iz ISO rođendana. */
function danRodjendana(iso: string): number {
  return Number(iso.split("-")[2]) || 0;
}


export default function RodjendaniSlave() {
  const { zaposleni } = useStore();
  const tekuciMesec = new Date().getMonth() + 1;

  const rodjendani = zaposleni
    .filter((z) => mesecRodjendana(z.rodjendan) === tekuciMesec)
    .map((z) => ({ ime: z.ime, dan: danRodjendana(z.rodjendan as string) }))
    .sort((a, b) => a.dan - b.dan);

  const slave = zaposleni
    .filter((z) => mesecRodjendana(z.slava) === tekuciMesec)
    .map((z) => ({ ime: z.ime, dan: danRodjendana(z.slava as string) }))
    .sort((a, b) => a.dan - b.dan);

  return (
    <div className="card mb-8 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">🎉</span>
        <h3 className="font-semibold text-slate-900">
          Slavlja u {MESECI[tekuciMesec - 1]}
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Rođendani */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">🎂 Rođendani</p>
          {rodjendani.length === 0 ? (
            <p className="text-sm text-slate-400">Nema rođendana ovog meseca.</p>
          ) : (
            <ul className="space-y-1.5">
              {rodjendani.map((r) => (
                <li key={r.ime} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{r.ime}</span>
                  <span className="text-slate-400">{r.dan}. {MESECI[tekuciMesec - 1]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Slave */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">🕯️ Slave</p>
          {slave.length === 0 ? (
            <p className="text-sm text-slate-400">Nema slava ovog meseca.</p>
          ) : (
            <ul className="space-y-1.5">
              {slave.map((s) => (
                <li key={s.ime} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-700">{s.ime}</span>
                  <span className="text-slate-400">{s.dan}. {MESECI[tekuciMesec - 1]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
