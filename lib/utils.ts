import {
  StatusZahteva,
  TipOdsustva,
  TIP_LABELE,
  Zaposleni,
  ZahtevZaOdsustvo,
  fondZaTip,
  trosiFond,
} from "./types";
import { jePraznik } from "./praznici";

/** Generiše jednostavan jedinstveni ID bez eksternih zavisnosti. */
export function generisiId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

function isoOd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dan = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dan}`;
}

/**
 * Broj radnih dana između dva datuma (uključivo), bez vikenda i bez državnih
 * praznika.
 */
export function brojRadnihDana(datumOd: string, datumDo: string): number {
  const od = new Date(datumOd);
  const doDatuma = new Date(datumDo);
  if (isNaN(od.getTime()) || isNaN(doDatuma.getTime()) || od > doDatuma) {
    return 0;
  }
  let broj = 0;
  const tekuci = new Date(od);
  while (tekuci <= doDatuma) {
    const dan = tekuci.getDay(); // 0 = nedelja, 6 = subota
    if (dan !== 0 && dan !== 6 && !jePraznik(isoOd(tekuci))) broj++;
    tekuci.setDate(tekuci.getDate() + 1);
  }
  return broj;
}

/** Formatira ISO datum u domaći format dd.mm.yyyy. */
export function formatDatum(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Zbir zauzetih dana godišnjeg odmora: svi NEodbijeni zahtevi (na čekanju +
 * odobreni), uključujući retroaktivne (prošli datumi). Time se dani skidaju od
 * fonda čim se zahtev unese, ne tek po odobravanju.
 *
 * @param ignorirajId opциono izostavi jedan zahtev (npr. onaj koji se upravo
 *        odobrava/pomera) da se ne bi dvostruko brojao.
 */
export function zauzetiGodisnji(
  zahtevi: ZahtevZaOdsustvo[],
  zaposleniId: string,
  ignorirajId?: string,
): number {
  return zahtevi
    .filter(
      (z) =>
        z.zaposleniId === zaposleniId &&
        trosiFond(z.tip) &&
        z.status !== "odbijeno" &&
        z.id !== ignorirajId,
    )
    .reduce((zbir, z) => zbir + brojRadnihDana(z.datumOd, z.datumDo), 0);
}

/** Iskorišćeni/zauzeti dani godišnjeg (na čekanju + odobreni), sve godine. */
export function iskorisceniGodisnji(
  zahtevi: ZahtevZaOdsustvo[],
  zaposleniId: string,
): number {
  return zauzetiGodisnji(zahtevi, zaposleniId);
}

/** Radni dani između dva datuma koji padaju u traženu kalendarsku godinu. */
export function brojRadnihDanaUGodini(
  datumOd: string,
  datumDo: string,
  godina: number,
): number {
  const od = new Date(datumOd);
  const doDatuma = new Date(datumDo);
  if (isNaN(od.getTime()) || isNaN(doDatuma.getTime()) || od > doDatuma) return 0;
  let broj = 0;
  const tekuci = new Date(od);
  while (tekuci <= doDatuma) {
    const dan = tekuci.getDay();
    if (
      tekuci.getFullYear() === godina &&
      dan !== 0 &&
      dan !== 6 &&
      !jePraznik(isoOd(tekuci))
    )
      broj++;
    tekuci.setDate(tekuci.getDate() + 1);
  }
  return broj;
}

/** Zauzeti dani godišnjeg fonda za konkretnu godinu (na čekanju + odobreni). */
export function iskorisceniGodisnjiUGodini(
  zahtevi: ZahtevZaOdsustvo[],
  zaposleniId: string,
  godina: number,
  ignorirajId?: string,
): number {
  return zahtevi
    .filter(
      (z) =>
        z.zaposleniId === zaposleniId &&
        trosiFond(z.tip) &&
        z.status !== "odbijeno" &&
        z.id !== ignorirajId,
    )
    .reduce((s, z) => s + brojRadnihDanaUGodini(z.datumOd, z.datumDo, godina), 0);
}

/**
 * Provera godišnjeg fonda po godini (fond se resetuje svake godine). Vraća
 * poruku greške ako termin prekoračuje fond bilo koje godine koju dotiče.
 */
export function proveriGodisnjiFond(
  zahtevi: ZahtevZaOdsustvo[],
  podnosilac: { id: string; brojDanaGodisnjeg: number },
  datumOd: string,
  datumDo: string,
  ignorirajId?: string,
): string | null {
  const g1 = Number(datumOd.slice(0, 4));
  const g2 = Number(datumDo.slice(0, 4));
  const godine = g1 === g2 ? [g1] : [g1, g2];
  for (const g of godine) {
    const trazeno = brojRadnihDanaUGodini(datumOd, datumDo, g);
    if (trazeno === 0) continue;
    const iskorisceno = iskorisceniGodisnjiUGodini(
      zahtevi,
      podnosilac.id,
      g,
      ignorirajId,
    );
    if (iskorisceno + trazeno > podnosilac.brojDanaGodisnjeg) {
      const preostalo = podnosilac.brojDanaGodisnjeg - iskorisceno;
      return `Prekoračen fond za ${g}: traženo ${trazeno}, a preostalo je ${preostalo} od ${podnosilac.brojDanaGodisnjeg} dana.`;
    }
  }
  return null;
}

/** Zauzeti dani konkretnog tipa odsustva u datoj godini (na čekanju + odobreni). */
export function iskorisceniPoTipuUGodini(
  zahtevi: ZahtevZaOdsustvo[],
  zaposleniId: string,
  godina: number,
  tip: TipOdsustva,
  ignorirajId?: string,
): number {
  return zahtevi
    .filter(
      (z) =>
        z.zaposleniId === zaposleniId &&
        z.tip === tip &&
        z.status !== "odbijeno" &&
        z.id !== ignorirajId,
    )
    .reduce((s, z) => s + brojRadnihDanaUGodini(z.datumOd, z.datumDo, godina), 0);
}

/** Poslednji dan do kog se preneseni dani smeju iskoristiti (30. jun). */
export const PRENOS_ROK_MESEC_DAN = "-06-30";

/**
 * Dani iz prethodne godine koji se prenose u godinu `godina`.
 *
 * Po Zakonu o radu neiskorišćeni godišnji se koristi do 30. juna naredne
 * godine. Prenos se računa SAMO ako prethodna godina uopšte ima evidentiran
 * zahtev za tog zaposlenog — inače bi svima kojima app ne pokriva prošlu
 * godinu bio dodeljen ceo fond kao „preneseno".
 */
export function preneseniDani(
  zahtevi: ZahtevZaOdsustvo[],
  podnosilac: { id: string; brojDanaGodisnjeg: number },
  godina: number,
): number {
  const prethodna = godina - 1;
  const imaEvidenciju = zahtevi.some(
    (z) =>
      z.zaposleniId === podnosilac.id &&
      z.status !== "odbijeno" &&
      Number(z.datumOd.slice(0, 4)) <= prethodna &&
      Number(z.datumDo.slice(0, 4)) >= prethodna,
  );
  if (!imaEvidenciju) return 0;

  const iskorisceno = iskorisceniPoTipuUGodini(
    zahtevi,
    podnosilac.id,
    prethodna,
    "godisnji",
  );
  return Math.max(0, podnosilac.brojDanaGodisnjeg - iskorisceno);
}

/**
 * Koliko prenesenih dana sme da se upotrebi za termin koji se završava
 * datuma `datumDo`. Posle 30. juna preneseni dani propadaju.
 */
export function prenosPrimenjiv(
  preneseno: number,
  godina: number,
  datumDo: string,
): number {
  return datumDo <= `${godina}${PRENOS_ROK_MESEC_DAN}` ? preneseno : 0;
}

/**
 * Provera fonda za bilo koji tip koji ga ima (godišnji, bolovanje). Vraća
 * poruku greške ako termin prekoračuje fond u nekoj od dodirnutih godina,
 * ili null ako je sve u redu (uključujući tipove bez fonda).
 */
export function proveriFondZaTip(
  zahtevi: ZahtevZaOdsustvo[],
  podnosilac: { id: string; brojDanaGodisnjeg: number; brojDanaSickLeave: number },
  tip: TipOdsustva,
  datumOd: string,
  datumDo: string,
  ignorirajId?: string,
): string | null {
  const fond = fondZaTip(podnosilac, tip);
  if (fond === null) return null;

  const g1 = Number(datumOd.slice(0, 4));
  const g2 = Number(datumDo.slice(0, 4));
  const godine = g1 === g2 ? [g1] : [g1, g2];
  for (const g of godine) {
    const trazeno = brojRadnihDanaUGodini(datumOd, datumDo, g);
    if (trazeno === 0) continue;
    const iskorisceno = iskorisceniPoTipuUGodini(
      zahtevi,
      podnosilac.id,
      g,
      tip,
      ignorirajId,
    );
    // Godišnji sme da povuče i prenesene dane iz prethodne godine (do 30.06).
    const prenos =
      tip === "godisnji"
        ? prenosPrimenjiv(preneseniDani(zahtevi, podnosilac, g), g, datumDo)
        : 0;
    const ukupno = fond + prenos;

    if (iskorisceno + trazeno > ukupno) {
      const preostalo = ukupno - iskorisceno;
      const opisFonda =
        prenos > 0 ? `${fond} + ${prenos} prenesenih` : String(fond);
      return `Prekoračen fond (${TIP_LABELE[tip]}) za ${g}: traženo ${trazeno}, a preostalo je ${preostalo} od ${opisFonda} dana.`;
    }
  }
  return null;
}

export function danas(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Da li se dva datumska intervala preklapaju (uključujući dodir krajeva). */
export function intervaliSePreklapaju(
  od1: string,
  do1: string,
  od2: string,
  do2: string,
): boolean {
  return od1 <= do2 && od2 <= do1;
}

export interface KonfliktDizajnera {
  zaposleni: Zaposleni;
  zahtev: ZahtevZaOdsustvo;
}

/**
 * Proverava da li bi odsustvo jednog dizajnera u datom periodu palo u isto
 * vreme kad i odsustvo nekog drugog dizajnera. Dva dizajnera ne smeju biti
 * odsutna istovremeno.
 *
 * Vraća prvi pronađeni konflikt ili `null` ako ga nema. Kandidat koji nije
 * dizajner nikada ne pravi konflikt.
 *
 * @param relevantniStatusi statusi tuđih zahteva koji se računaju kao zauzeti
 *        period (npr. `["na_cekanju", "odobreno"]` pri kreiranju, ili samo
 *        `["odobreno"]` pri odobravanju).
 */
export function pronadjiKonfliktDizajnera(
  zahtevi: ZahtevZaOdsustvo[],
  zaposleni: Zaposleni[],
  kandidat: {
    zaposleniId: string;
    datumOd: string;
    datumDo: string;
    ignorirajZahtevId?: string;
  },
  relevantniStatusi: StatusZahteva[] = ["na_cekanju", "odobreno"],
): KonfliktDizajnera | null {
  const podnosilac = zaposleni.find((z) => z.id === kandidat.zaposleniId);
  if (!podnosilac || podnosilac.uloga !== "dizajner") return null;

  for (const z of zahtevi) {
    if (z.id === kandidat.ignorirajZahtevId) continue;
    if (z.zaposleniId === kandidat.zaposleniId) continue;
    if (!relevantniStatusi.includes(z.status)) continue;

    const drugi = zaposleni.find((zap) => zap.id === z.zaposleniId);
    if (!drugi || drugi.uloga !== "dizajner") continue;

    if (
      intervaliSePreklapaju(
        kandidat.datumOd,
        kandidat.datumDo,
        z.datumOd,
        z.datumDo,
      )
    ) {
      return { zaposleni: drugi, zahtev: z };
    }
  }
  return null;
}
