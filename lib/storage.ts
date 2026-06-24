import { Zaposleni, ZahtevZaOdsustvo } from "./types";
import { generisiId } from "./utils";

// Verzija "v2" — uvodi uloge i novi tim; stari ključevi se zanemaruju.
const KLJUC_ZAPOSLENI = "go_zaposleni_v2";
const KLJUC_ZAHTEVI = "go_zahtevi_v2";

export function ucitajZaposlene(): Zaposleni[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KLJUC_ZAPOSLENI);
    if (!raw) return pocetniZaposleni();
    return JSON.parse(raw) as Zaposleni[];
  } catch {
    return pocetniZaposleni();
  }
}

export function sacuvajZaposlene(zaposleni: Zaposleni[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KLJUC_ZAPOSLENI, JSON.stringify(zaposleni));
}

export function ucitajZahteve(): ZahtevZaOdsustvo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KLJUC_ZAHTEVI);
    if (!raw) return [];
    return JSON.parse(raw) as ZahtevZaOdsustvo[];
  } catch {
    return [];
  }
}

export function sacuvajZahteve(zahtevi: ZahtevZaOdsustvo[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KLJUC_ZAHTEVI, JSON.stringify(zahtevi));
}

/** Početni tim pri prvom pokretanju. */
function pocetniZaposleni(): Zaposleni[] {
  return [
    {
      id: generisiId(),
      ime: "Marko Mijatov",
      pozicija: "Dizajner",
      email: "marko.mijatov@firma.rs",
      uloga: "dizajner",
      brojDanaGodisnjeg: 20,
    },
    {
      id: generisiId(),
      ime: "Milan Kujundžić",
      pozicija: "Dizajner",
      email: "milan.kujundzic@firma.rs",
      uloga: "dizajner",
      brojDanaGodisnjeg: 20,
    },
    {
      id: generisiId(),
      ime: "Boris Šimunek",
      pozicija: "Dizajner",
      email: "boris.simunek@firma.rs",
      uloga: "dizajner",
      brojDanaGodisnjeg: 20,
    },
    {
      id: generisiId(),
      ime: "Vladan Katjez",
      pozicija: "Dizajner",
      email: "vladan.katjez@firma.rs",
      uloga: "dizajner",
      brojDanaGodisnjeg: 20,
    },
    {
      id: generisiId(),
      ime: "Nenad Miličev",
      pozicija: "Frontend developer",
      email: "nenad.milicev@firma.rs",
      uloga: "frontend",
      brojDanaGodisnjeg: 20,
    },
    {
      id: generisiId(),
      ime: "Ognen Đurasinović",
      pozicija: "SEO specijalista",
      email: "ognen.djurasinovic@firma.rs",
      uloga: "seo",
      brojDanaGodisnjeg: 20,
    },
    {
      id: generisiId(),
      ime: "Sava Marinković",
      pozicija: "Šef",
      email: "sava.marinkovic@firma.rs",
      uloga: "sef",
      brojDanaGodisnjeg: 25,
    },
  ];
}
