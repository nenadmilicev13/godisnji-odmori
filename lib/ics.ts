import { createHmac } from "crypto";
import { TipOdsustva, TIP_LABELE, ZahtevZaOdsustvo } from "./types";

const TAJNA = process.env.AUTH_SECRET || "dev-nesiguran-kljuc-promeni-u-produkciji";

/**
 * Stabilan token za kalendar feed jednog zaposlenog. Nije sesija — link se
 * lepi u Google Calendar pa mora da važi neograničeno. Ako procuri, otkriva
 * samo raspored odsustava tima; menjanje AUTH_SECRET poništava sve tokene.
 */
export function kalendarToken(zaposleniId: string): string {
  return createHmac("sha256", TAJNA)
    .update(`ics:${zaposleniId}`)
    .digest("hex")
    .slice(0, 32);
}

export function proveriKalendarToken(zaposleniId: string, token: string): boolean {
  const ocekivan = kalendarToken(zaposleniId);
  return token.length === ocekivan.length && token === ocekivan;
}

/** yyyy-mm-dd -> yyyymmdd */
function ics(datum: string): string {
  return datum.replace(/-/g, "");
}

/** Dan posle datumDo — ICS all-day događaj ima ekskluzivan kraj. */
function danPosle(datum: string): string {
  const [g, m, d] = datum.split("-").map(Number);
  const dt = new Date(Date.UTC(g, m - 1, d + 1));
  return [
    dt.getUTCFullYear(),
    String(dt.getUTCMonth() + 1).padStart(2, "0"),
    String(dt.getUTCDate()).padStart(2, "0"),
  ].join("");
}

/** Escape po RFC 5545 — zarez, tačka-zarez, obrnuta kosa crta, novi red. */
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Prelama liniju na 75 okteta, kako traži RFC 5545. */
function prelomi(linija: string): string {
  if (linija.length <= 75) return linija;
  const delovi: string[] = [linija.slice(0, 75)];
  let ostatak = linija.slice(75);
  while (ostatak.length > 74) {
    delovi.push(" " + ostatak.slice(0, 74));
    ostatak = ostatak.slice(74);
  }
  if (ostatak) delovi.push(" " + ostatak);
  return delovi.join("\r\n");
}

type Stavka = ZahtevZaOdsustvo & { imeZaposlenog: string };

/** Sastavlja .ics fajl sa odobrenim odsustvima tima. */
export function napraviIcs(stavke: Stavka[], stamp: string): string {
  const linije = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Baseline//Godisnji odmori//SR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Godišnji odmori — Baseline",
    "X-WR-TIMEZONE:Europe/Belgrade",
  ];

  for (const z of stavke) {
    const naslov = `${z.imeZaposlenog} — ${TIP_LABELE[z.tip as TipOdsustva]}`;
    linije.push(
      "BEGIN:VEVENT",
      `UID:${z.id}@godisnji-odmori.baseline.rs`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ics(z.datumOd)}`,
      `DTEND;VALUE=DATE:${danPosle(z.datumDo)}`,
      prelomi(`SUMMARY:${esc(naslov)}`),
      "TRANSP:TRANSPARENT",
    );
    if (z.napomena) {
      linije.push(prelomi(`DESCRIPTION:${esc(z.napomena)}`));
    }
    linije.push("END:VEVENT");
  }

  linije.push("END:VCALENDAR");
  return linije.join("\r\n") + "\r\n";
}
