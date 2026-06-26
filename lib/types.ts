export type TipOdsustva =
  | "godisnji"
  | "bolovanje"
  | "slobodan_dan"
  | "placeno_odsustvo"
  | "neplaceno_odsustvo";

export type StatusZahteva = "na_cekanju" | "odobreno" | "odbijeno";

export type Uloga = "dizajner" | "frontend" | "seo" | "sef" | "ostalo";

export interface Zaposleni {
  id: string;
  ime: string;
  pozicija: string;
  email: string;
  uloga: Uloga;
  lozinka?: string; // klijentski demo-login (nije prava sigurnost)
  brojDanaGodisnjeg: number; // ukupan godišnji fond dana
  rodjendan?: string | null; // yyyy-mm-dd
  slava?: string | null;
}

/** Admin (šef) je jedini koji može da odobrava/odbija zahteve. */
export function jeAdmin(z: Zaposleni | null | undefined): boolean {
  return z?.uloga === "sef";
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
  bolovanje: "Bolovanje",
  slobodan_dan: "Slobodan dan",
  placeno_odsustvo: "Plaćeno odsustvo",
  neplaceno_odsustvo: "Neplaćeno odsustvo",
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
