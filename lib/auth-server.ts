import { prisma } from "./db";
import { trenutniKorisnikId } from "./session";
import { Zaposleni, ZahtevZaOdsustvo } from "./types";

/** Puni zapis prijavljenog zaposlenog (sa lozinkaHash) ili null. */
export async function trenutniKorisnik() {
  const id = await trenutniKorisnikId();
  if (!id) return null;
  return prisma.zaposleni.findUnique({ where: { id } });
}

type ZaposleniRed = {
  id: string;
  ime: string;
  pozicija: string;
  email: string;
  uloga: string;
  brojDanaGodisnjeg: number;
  rodjendan?: string | null;
  slava?: string | null;
  lozinkaHash?: string;
};

/** Uklanja lozinkaHash pre slanja klijentu. */
export function javniZaposleni(z: ZaposleniRed): Zaposleni {
  return {
    id: z.id,
    ime: z.ime,
    pozicija: z.pozicija,
    email: z.email,
    uloga: z.uloga as Zaposleni["uloga"],
    brojDanaGodisnjeg: z.brojDanaGodisnjeg,
    rodjendan: z.rodjendan ?? null,
    slava: z.slava ?? null,
  };
}

type ZahtevRed = {
  id: string;
  zaposleniId: string;
  tip: string;
  datumOd: string;
  datumDo: string;
  napomena: string;
  status: string;
  kreirano: Date;
};

export function javniZahtev(z: ZahtevRed): ZahtevZaOdsustvo {
  return {
    id: z.id,
    zaposleniId: z.zaposleniId,
    tip: z.tip as ZahtevZaOdsustvo["tip"],
    datumOd: z.datumOd,
    datumDo: z.datumDo,
    napomena: z.napomena,
    status: z.status as ZahtevZaOdsustvo["status"],
    kreirano: z.kreirano.toISOString(),
  };
}
