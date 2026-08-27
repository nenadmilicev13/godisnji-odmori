export type TipOdsustva =
  | "godisnji"
  | "sick_leave"
  | "bolovanje"
  | "slobodan_dan"
  | "placeno_odsustvo"
  | "neplaceno_odsustvo"
  | "nagradni_dan";

export type StatusZahteva = "na_cekanju" | "odobreno" | "odbijeno";

export interface Notifikacija {
  id: string;
  korisnikId: string;
  tekst: string;
  link?: string | null;
  procitano: boolean;
  kreirano: string; // ISO
}

export type Uloga = "dizajner" | "frontend" | "seo" | "sef" | "ostalo";

export interface Zaposleni {
  id: string;
  ime: string;
  pozicija: string;
  email: string;
  uloga: Uloga;
  lozinka?: string; // klijentski demo-login (nije prava sigurnost)
  brojDanaGodisnjeg: number; // ukupan godišnji fond dana
  brojDanaSickLeave: number; // fond sick leave dana, podrazumevano 5
  rodjendan?: string | null; // yyyy-mm-dd
  slava?: string | null;
  slika?: string | null; // profilna slika (data URL)
}

/** Admin (šef) je jedini koji može da odobrava/odbija zahteve. */
export function jeAdmin(z: Zaposleni | null | undefined): boolean {
  return z?.uloga === "sef";
}

/** Tipovi odsustva koji troše godišnji fond. */
export const TIPOVI_FONDA: TipOdsustva[] = ["godisnji"];

export function trosiFond(tip: TipOdsustva): boolean {
  return TIPOVI_FONDA.includes(tip);
}

/** Polje zaposlenog u kojem stoji fond za dati tip odsustva. */
export type PoljeFonda = "brojDanaGodisnjeg" | "brojDanaSickLeave";

export const FOND_POLJE: Partial<Record<TipOdsustva, PoljeFonda>> = {
  godisnji: "brojDanaGodisnjeg",
  sick_leave: "brojDanaSickLeave",
};

/** Koliko dana fonda zaposleni ima za dati tip; null ako tip nema fond. */
export function fondZaTip(
  z: { brojDanaGodisnjeg: number; brojDanaSickLeave: number },
  tip: TipOdsustva,
): number | null {
  const polje = FOND_POLJE[tip];
  return polje ? z[polje] : null;
}

/** Tipovi koje zaposleni može da izabere pri unosu (admin dodatno „nagradni_dan"). */
export const TIPOVI_ZA_UNOS: TipOdsustva[] = [
  "godisnji",
  "sick_leave",
  "bolovanje",
];

export function tipoviZaUnos(admin: boolean): TipOdsustva[] {
  return admin ? [...TIPOVI_ZA_UNOS, "nagradni_dan"] : TIPOVI_ZA_UNOS;
}

export interface ZahtevZaOdsustvo {
  id: string;
  zaposleniId: string;
  tip: TipOdsustva;
  datumOd: string; // ISO yyyy-mm-dd
  datumDo: string; // ISO yyyy-mm-dd
  napomena: string;
  status: StatusZahteva;
  kreirano: string; // ISO datetime
}

export const TIP_LABELE: Record<TipOdsustva, string> = {
  godisnji: "Godišnji odmor",
  sick_leave: "Sick leave",
  bolovanje: "Bolovanje",
  slobodan_dan: "Slobodan dan",
  placeno_odsustvo: "Plaćeno odsustvo",
  neplaceno_odsustvo: "Neplaćeno odsustvo",
  nagradni_dan: "Nagradni dan 🎁",
};

export const STATUS_LABELE: Record<StatusZahteva, string> = {
  na_cekanju: "Na čekanju",
  odobreno: "Odobreno",
  odbijeno: "Odbijeno",
};

export const ULOGA_LABELE: Record<Uloga, string> = {
  dizajner: "Dizajner",
  frontend: "Frontend",
  seo: "SEO",
  sef: "Šef",
  ostalo: "Ostalo",
};
