"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
  StatusZahteva,
  ZahtevZaOdsustvo,
  STATUS_LABELE,
  TIP_LABELE,
  jeAdmin,
} from "@/lib/types";
import { brojRadnihDana, formatDatum } from "@/lib/utils";
import { nazivPraznika } from "@/lib/praznici";
import Modal from "./Modal";
import Badge from "./Badge";

const LEVO = 208; // širina leve kolone (zaposleni)
const SIRINA_DANA = 40; // px po danu
const GODINA_UNAPRED = 3; // koliko godina unapred ide osa (npr. 2026 -> kraj 2029)
const VISINA_REDA = 56;

const MESECI = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];

const BOJA_STATUSA: Record<StatusZahteva, string> = {
  odobreno: "bg-brand-500",
  na_cekanju: "bg-amber-400",
  odbijeno: "bg-rose-400",
};

const BOJE_AVATARA = [
  "bg-brand-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  "bg-sky-500", "bg-violet-500", "bg-orange-500", "bg-teal-500",
];

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dan = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dan}`;
}

function parseIso(s: string): Date {
  const [g, m, d] = s.split("-").map(Number);
  return new Date(g, m - 1, d);
}

/** Razlika u danima (bIso - aIso). */
function razlikaDana(aIso: string, bIso: string): number {
  return Math.round(
    (parseIso(bIso).getTime() - parseIso(aIso).getTime()) / 86400000,
  );
}

/** Pomera ISO datum za n dana. */
function pomeriIso(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export default function Kalendar() {
  const {
    zaposleni,
    zahtevi,
    trenutniKorisnik,
    pomeriZahtev,
    promeniStatus,
    obrisiZahtev,
  } = useStore();
  const admin = jeAdmin(trenutniKorisnik);
  const danasIso = iso(new Date());

  const imeZaposlenog = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";

  // Pan (prevlačenje cele ose mišem).
  const skrolRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ active: false, startX: 0, startScroll: 0 });

  // Prevlačenje trake (admin) za promenu termina.
  const dragRef = useRef<{ id: string; startX: number; datumOd: string; datumDo: string } | null>(null);
  const pomeranoRef = useRef(false);
  const [drag, setDrag] = useState<{ id: string; pomak: number } | null>(null);
  const [poruka, setPoruka] = useState("");
  const [cuva, setCuva] = useState(false);

  // Brzi pregled zahteva (klik na traku).
  const [detalj, setDetalj] = useState<ZahtevZaOdsustvo | null>(null);

  function panDown(e: React.PointerEvent) {
    const el = skrolRef.current;
    if (!el || dragRef.current) return;
    pan.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
  }
  function panMove(e: React.PointerEvent) {
    if (!pan.current.active || !skrolRef.current) return;
    skrolRef.current.scrollLeft =
      pan.current.startScroll - (e.clientX - pan.current.startX);
  }
  function panUp() {
    pan.current.active = false;
  }

  function trakaDown(e: React.PointerEvent, r: ZahtevZaOdsustvo) {
    e.stopPropagation(); // ne pokreći pan kad se dira traka
    if (!admin) return; // ne-admin samo klik (pregled), bez prevlačenja
    if (r.status !== "na_cekanju") return; // odobreno/odbijeno se ne pomera
    e.preventDefault();
    pomeranoRef.current = false;
    dragRef.current = { id: r.id, startX: e.clientX, datumOd: r.datumOd, datumDo: r.datumDo };
    setDrag({ id: r.id, pomak: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function trakaMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dani = Math.round((e.clientX - dragRef.current.startX) / SIRINA_DANA);
    if (dani !== 0) pomeranoRef.current = true;
    setDrag({ id: dragRef.current.id, pomak: dani });
  }
  async function trakaUp() {
    const d = dragRef.current;
    const trenutniPomak = drag?.pomak ?? 0;
    dragRef.current = null;
    setDrag(null);
    if (!d || trenutniPomak === 0) return;
    setCuva(true);
    const greska = await pomeriZahtev(
      d.id,
      pomeriIso(d.datumOd, trenutniPomak),
      pomeriIso(d.datumDo, trenutniPomak),
    );
    setCuva(false);
    setPoruka(greska ?? "");
  }
  function trakaKlik(r: ZahtevZaOdsustvo) {
    // Ako je bilo prevlačenja, ne otvaraj pregled.
    if (pomeranoRef.current) {
      pomeranoRef.current = false;
      return;
    }
    setDetalj(r);
  }
  async function akcija(fn: () => Promise<string | null>) {
    const greska = await fn();
    setDetalj(null);
    setPoruka(greska ?? "");
  }

  const [pretraga, setPretraga] = useState("");
  const [statusFilter, setStatusFilter] = useState<"sve" | StatusZahteva>("sve");

  // Fiksni opseg ose: od 14 dana pre danas do kraja (tekuća godina + N).
  const pocetakIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return iso(d);
  }, []);
  const krajIso = useMemo(() => {
    const g = new Date().getFullYear() + GODINA_UNAPRED;
    return `${g}-12-31`;
  }, []);
  const brojDana = razlikaDana(pocetakIso, krajIso) + 1;

  // Svi dani u opsegu.
  const dani = useMemo(() => {
    const start = parseIso(pocetakIso);
    return Array.from({ length: brojDana }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [pocetakIso, brojDana]);

  // Skroluj na poziciju (dani od početka), centriraj malo pre.
  function skrolujNa(daniOdPocetka: number) {
    if (skrolRef.current)
      skrolRef.current.scrollLeft = Math.max(0, (daniOdPocetka - 4) * SIRINA_DANA);
  }
  function pomeri(delta: number) {
    if (skrolRef.current) skrolRef.current.scrollLeft += delta * SIRINA_DANA;
  }
  function naDanas() {
    skrolujNa(razlikaDana(pocetakIso, danasIso));
  }

  // Na prvom prikazu skroluj na danas.
  useEffect(() => {
    skrolujNa(razlikaDana(pocetakIso, danasIso));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markeri za godišnje ponavljajuće datume (rođendan/slava) kroz ceo opseg.
  const prvaGodina = Number(pocetakIso.slice(0, 4));
  const zadnjaGodina = Number(krajIso.slice(0, 4));
  function ponavljajuciMarkeri(datum: string | null | undefined, emoji: string, naziv: string) {
    if (!datum) return [];
    const mmdd = datum.slice(5); // "mm-dd"
    const rez: { levo: number; emoji: string; naslov: string }[] = [];
    for (let g = prvaGodina; g <= zadnjaGodina; g++) {
      const isoD = `${g}-${mmdd}`;
      const off = razlikaDana(pocetakIso, isoD);
      if (off >= 0 && off < brojDana) {
        rez.push({
          levo: off * SIRINA_DANA,
          emoji,
          naslov: `${naziv}: ${mmdd.slice(3)}.${mmdd.slice(0, 2)}.`,
        });
      }
    }
    return rez;
  }

  const filtriraniZaposleni = zaposleni.filter((z) =>
    z.ime.toLowerCase().includes(pretraga.trim().toLowerCase()),
  );

  const sirinaOse = brojDana * SIRINA_DANA;

  // Meta podaci po danu (računaju se jednom, ne pri svakom drag pomeranju).
  const daniMeta = useMemo(
    () =>
      dani.map((d) => {
        const dan = d.getDay();
        const isoD = iso(d);
        return {
          broj: d.getDate(),
          weekend: dan === 0 || dan === 6,
          praznik: !!nazivPraznika(isoD),
          jeDanas: isoD === danasIso,
        };
      }),
    [dani, danasIso],
  );

  // Pozadinski sloj (vikend/praznik) — isti za sve redove, gradi se jednom.
  const tintSloj = useMemo(
    () =>
      daniMeta.map((m, i) =>
        m.weekend || m.praznik ? (
          <div
            key={i}
            className={
              m.praznik
                ? "absolute top-0 h-full bg-amber-50"
                : "absolute top-0 h-full bg-slate-50"
            }
            style={{ left: i * SIRINA_DANA, width: SIRINA_DANA }}
          />
        ) : null,
      ),
    [daniMeta],
  );

  // Oznake meseca: gde u opsegu počinje novi mesec (ili prvi dan).
  const oznakeMeseca = dani
    .map((d, i) => ({ d, i }))
    .filter(({ d, i }) => i === 0 || d.getDate() === 1)
    .map(({ d, i }) => ({
      labela: `${MESECI[d.getMonth()]} ${d.getFullYear()}`,
      levo: i * SIRINA_DANA,
    }));

  return (
    <div className="card overflow-hidden">
      {/* Alatna traka */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
        <input
          className="input h-9 w-48 py-1.5 text-sm"
          placeholder="Pretraži zaposlene..."
          value={pretraga}
          onChange={(e) => setPretraga(e.target.value)}
        />
        <select
          className="input h-9 w-36 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="sve">Svi statusi</option>
          <option value="odobreno">{STATUS_LABELE.odobreno}</option>
          <option value="na_cekanju">{STATUS_LABELE.na_cekanju}</option>
          <option value="odbijeno">{STATUS_LABELE.odbijeno}</option>
        </select>

        <div className="ml-auto flex items-center gap-3">
          {(["odobreno", "na_cekanju", "odbijeno"] as StatusZahteva[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${BOJA_STATUSA[s]}`} />
              {STATUS_LABELE[s]}
            </span>
          ))}
          <div className="flex items-center gap-1 pl-2">
            <button onClick={naDanas} className="btn-ghost px-2 py-1 text-xs">Danas</button>
            <button onClick={() => pomeri(-14)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Nazad">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button onClick={() => pomeri(14)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Napred">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Poruka (greška pri pomeranju) / pomoć */}
      {poruka && (
        <div className="flex items-start justify-between gap-3 border-b border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <span>{poruka}</span>
          <button onClick={() => setPoruka("")} className="shrink-0 font-medium text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}
      {admin && (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-xs text-slate-400">
          💡 Prevuci traku levo/desno da pomeriš termin · uhvati praznu površinu da pomeriš osu
        </div>
      )}

      {/* Timeline */}
      <div
        ref={skrolRef}
        onPointerDown={panDown}
        onPointerMove={panMove}
        onPointerUp={panUp}
        onPointerLeave={panUp}
        className="cursor-grab overflow-x-auto active:cursor-grabbing"
      >
        <div style={{ minWidth: LEVO + sirinaOse }}>
          {/* Zaglavlje: meseci + dani */}
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
            {/* Meseci */}
            <div className="relative h-6" style={{ marginLeft: LEVO }}>
              {oznakeMeseca.map((o) => (
                <span
                  key={o.labela + o.levo}
                  className="absolute top-1 text-xs font-semibold text-slate-600"
                  style={{ left: o.levo + 4 }}
                >
                  {o.labela}
                </span>
              ))}
            </div>
            {/* Dani */}
            <div className="flex">
              <div
                className="sticky left-0 z-10 shrink-0 bg-white"
                style={{ width: LEVO }}
              />
              {daniMeta.map((m, i) => (
                <div
                  key={i}
                  className={`shrink-0 py-1 text-center text-xs ${
                    m.weekend || m.praznik ? "bg-slate-50 text-slate-400" : "text-slate-500"
                  }`}
                  style={{ width: SIRINA_DANA }}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      m.jeDanas ? "bg-brand-600 font-semibold text-white" : ""
                    } ${m.praznik && !m.jeDanas ? "text-amber-500" : ""}`}
                  >
                    {m.broj}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Redovi po zaposlenom */}
          {filtriraniZaposleni.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Nema zaposlenih za „{pretraga}“.
            </div>
          ) : (
            filtriraniZaposleni.map((z, idx) => {
              const inicijali = z.ime.split(" ").map((d) => d[0]).slice(0, 2).join("");
              const markeri = [
                ...ponavljajuciMarkeri(z.rodjendan, "🎂", "Rođendan"),
                ...ponavljajuciMarkeri(z.slava, "🕯️", "Slava"),
              ];
              const trake = zahtevi
                .filter((r) => r.zaposleniId === z.id)
                .filter((r) => statusFilter === "sve" || r.status === statusFilter)
                .map((r) => {
                  const start = Math.max(0, razlikaDana(pocetakIso, r.datumOd));
                  const krajExcl = Math.min(
                    brojDana,
                    razlikaDana(pocetakIso, r.datumDo) + 1,
                  );
                  if (krajExcl <= 0 || start >= brojDana || krajExcl <= start)
                    return null;
                  return {
                    r,
                    levo: start * SIRINA_DANA,
                    sirina: (krajExcl - start) * SIRINA_DANA,
                    dana: brojRadnihDana(r.datumOd, r.datumDo),
                  };
                })
                .filter(Boolean) as {
                  r: (typeof zahtevi)[number];
                  levo: number;
                  sirina: number;
                  dana: number;
                }[];

              return (
                <div key={z.id} className="flex border-b border-slate-100">
                  {/* Leva kolona */}
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 bg-white px-3"
                    style={{ width: LEVO, height: VISINA_REDA }}
                  >
                    {z.slika ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={z.slika} alt={z.ime} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${BOJE_AVATARA[idx % BOJE_AVATARA.length]}`}>
                        {inicijali}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{z.ime}</p>
                      <p className="truncate text-xs text-slate-400">{z.pozicija}</p>
                    </div>
                  </div>

                  {/* Vremenska osa reda */}
                  <div
                    className="relative shrink-0"
                    style={{
                      width: sirinaOse,
                      height: VISINA_REDA,
                      backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${SIRINA_DANA - 1}px, #f1f5f9 ${SIRINA_DANA - 1}px, #f1f5f9 ${SIRINA_DANA}px)`,
                    }}
                  >
                    {/* Tint za vikend/praznik (deljeni sloj) */}
                    {tintSloj}

                    {/* Markeri: rođendan / slava */}
                    {markeri.map((mk, i) => (
                      <span
                        key={i}
                        title={mk.naslov}
                        className="pointer-events-none absolute top-0 z-10 text-center text-[11px] leading-none"
                        style={{ left: mk.levo, width: SIRINA_DANA, paddingTop: 1 }}
                      >
                        {mk.emoji}
                      </span>
                    ))}

                    {/* Trake odsustva */}
                    {trake.map((t) => {
                      const seVuce = drag?.id === t.r.id;
                      const pomakPx = seVuce ? drag!.pomak * SIRINA_DANA : 0;
                      return (
                        <div
                          key={t.r.id}
                          onPointerDown={(e) => trakaDown(e, t.r)}
                          onPointerMove={trakaMove}
                          onPointerUp={trakaUp}
                          onClick={() => trakaKlik(t.r)}
                          title={`${TIP_LABELE[t.r.tip]} · ${t.r.datumOd} – ${t.r.datumDo} · ${STATUS_LABELE[t.r.status]} · klik za detalje${admin ? ", prevuci za novi termin" : ""}`}
                          className={`absolute top-1/2 flex cursor-pointer items-center overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm ${BOJA_STATUSA[t.r.status]} ${admin ? "active:cursor-grabbing" : ""} ${seVuce ? "z-20 opacity-90 ring-2 ring-white" : ""} ${cuva && seVuce ? "animate-pulse" : ""}`}
                          style={{
                            left: t.levo + 2,
                            width: Math.max(0, t.sirina - 4),
                            height: 26,
                            transform: `translateY(-50%) translateX(${pomakPx}px)`,
                            touchAction: "none",
                          }}
                        >
                          {t.dana}d
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Brzi pregled zahteva */}
      <Modal
        otvoren={!!detalj}
        naslov="Zahtev za odsustvo"
        onZatvori={() => setDetalj(null)}
      >
        {detalj && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {imeZaposlenog(detalj.zaposleniId)}
              </span>
              <Badge status={detalj.status} />
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p>
                <span className="text-slate-400">Tip:</span>{" "}
                {TIP_LABELE[detalj.tip]}
              </p>
              <p>
                <span className="text-slate-400">Period:</span>{" "}
                {formatDatum(detalj.datumOd)} – {formatDatum(detalj.datumDo)}
              </p>
              <p>
                <span className="text-slate-400">Trajanje:</span>{" "}
                {brojRadnihDana(detalj.datumOd, detalj.datumDo)} radnih dana
              </p>
              {detalj.napomena && (
                <p className="mt-1 text-slate-500">„{detalj.napomena}“</p>
              )}
            </div>

            {(admin || detalj.zaposleniId === trenutniKorisnik?.id) && (
              <div className="flex flex-wrap justify-end gap-2">
                {admin && detalj.status !== "odobreno" && (
                  <button
                    onClick={() => akcija(() => promeniStatus(detalj.id, "odobreno"))}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Odobri
                  </button>
                )}
                {admin && detalj.status !== "odbijeno" && (
                  <button
                    onClick={() => akcija(() => promeniStatus(detalj.id, "odbijeno"))}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  >
                    Odbij
                  </button>
                )}
                <button
                  onClick={() => akcija(() => obrisiZahtev(detalj.id))}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Obriši
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
