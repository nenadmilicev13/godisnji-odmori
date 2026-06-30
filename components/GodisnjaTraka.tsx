"use client";

import { useStore } from "@/lib/store";
import { TIP_LABELE } from "@/lib/types";
import { formatDatum } from "@/lib/utils";

const MESECI = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function parseIso(s: string): Date {
  const [g, m, d] = s.split("-").map(Number);
  return new Date(g, m - 1, d);
}

/** Horizontalna traka odsustava za zaposlenog kroz izabranu godinu. */
export default function GodisnjaTraka({
  zaposleniId,
  godina,
}: {
  zaposleniId: string;
  godina: number;
}) {
  const { zahtevi } = useStore();

  const pocetak = new Date(godina, 0, 1);
  const kraj = new Date(godina, 11, 31);
  const ukupno =
    Math.round((kraj.getTime() - pocetak.getTime()) / 86400000) + 1;
  const indeks = (d: Date) =>
    Math.round((d.getTime() - pocetak.getTime()) / 86400000);

  const segmenti = zahtevi
    .filter((z) => z.zaposleniId === zaposleniId && z.status !== "odbijeno")
    .map((z) => {
      const s = parseIso(z.datumOd);
      const e = parseIso(z.datumDo);
      const s2 = s < pocetak ? pocetak : s;
      const e2 = e > kraj ? kraj : e;
      if (e2 < pocetak || s2 > kraj) return null;
      const levo = (indeks(s2) / ukupno) * 100;
      const sirina = ((indeks(e2) - indeks(s2) + 1) / ukupno) * 100;
      return { z, levo, sirina };
    })
    .filter(Boolean) as { z: (typeof zahtevi)[number]; levo: number; sirina: number }[];

  return (
    <div>
      {/* Meseci */}
      <div className="relative mb-1 h-4">
        {MESECI.map((m, i) => (
          <span
            key={i}
            className="absolute top-0 text-[10px] text-slate-400"
            style={{ left: `${(indeks(new Date(godina, i, 1)) / ukupno) * 100}%` }}
          >
            {m}
          </span>
        ))}
      </div>
      {/* Traka */}
      <div
        className="relative h-6 overflow-hidden rounded-md bg-slate-100"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, transparent, transparent calc(100%/12 - 1px), #e2e8f0 calc(100%/12 - 1px), #e2e8f0 calc(100%/12))",
        }}
      >
        {segmenti.map(({ z, levo, sirina }) => (
          <div
            key={z.id}
            title={`${TIP_LABELE[z.tip]} · ${formatDatum(z.datumOd)} – ${formatDatum(z.datumDo)} · ${z.status === "odobreno" ? "odobreno" : "na čekanju"}`}
            className={`absolute top-1 h-4 rounded-sm ${
              z.status === "odobreno" ? "bg-emerald-400" : "bg-amber-400"
            }`}
            style={{ left: `${levo}%`, width: `${Math.max(sirina, 0.6)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Odobreno
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Na čekanju
        </span>
      </div>
    </div>
  );
}
