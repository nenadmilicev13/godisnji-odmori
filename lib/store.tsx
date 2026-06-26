"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Zaposleni, ZahtevZaOdsustvo, StatusZahteva } from "./types";

interface StoreContext {
  zaposleni: Zaposleni[];
  zahtevi: ZahtevZaOdsustvo[];
  trenutniKorisnik: Zaposleni | null;
  ucitano: boolean;
  prijava: (email: string, lozinka: string) => Promise<string | null>;
  odjava: () => Promise<void>;
  dodajZahtev: (
    z: Omit<ZahtevZaOdsustvo, "id" | "kreirano" | "status">,
  ) => Promise<string | null>;
  promeniStatus: (id: string, status: StatusZahteva) => Promise<string | null>;
  pomeriZahtev: (
    id: string,
    datumOd: string,
    datumDo: string,
  ) => Promise<string | null>;
  obrisiZahtev: (id: string) => Promise<string | null>;
  dodajZaposlenog: (z: Omit<Zaposleni, "id">) => Promise<string | null>;
  azurirajProfil: (
    id: string,
    podaci: { ime?: string; rodjendan?: string | null; slava?: string | null },
  ) => Promise<string | null>;
  promeniLozinku: (
    id: string,
    podaci: { staraLozinka?: string; novaLozinka: string },
  ) => Promise<string | null>;
  obrisiZaposlenog: (id: string) => Promise<string | null>;
}

const Ctx = createContext<StoreContext | null>(null);

/** Pomoćnik: parsira JSON i vraća poruku greške iz odgovora (ili null). */
async function greskaIz(res: Response): Promise<string | null> {
  if (res.ok) return null;
  try {
    const data = await res.json();
    return data?.greska ?? "Došlo je do greške.";
  } catch {
    return "Došlo je do greške.";
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [zaposleni, setZaposleni] = useState<Zaposleni[]>([]);
  const [zahtevi, setZahtevi] = useState<ZahtevZaOdsustvo[]>([]);
  const [trenutniKorisnik, setKorisnik] = useState<Zaposleni | null>(null);
  const [ucitano, setUcitano] = useState(false);

  const ucitajPodatke = useCallback(async () => {
    const [rz, rzh] = await Promise.all([
      fetch("/api/zaposleni"),
      fetch("/api/zahtevi"),
    ]);
    if (rz.ok) setZaposleni((await rz.json()).zaposleni);
    if (rzh.ok) setZahtevi((await rzh.json()).zahtevi);
  }, []);

  // Inicijalno: ko je prijavljen + podaci.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        const korisnik = res.ok ? (await res.json()).korisnik : null;
        setKorisnik(korisnik);
        if (korisnik) await ucitajPodatke();
      } finally {
        setUcitano(true);
      }
    })();
  }, [ucitajPodatke]);

  const prijava = useCallback(
    async (email: string, lozinka: string) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lozinka }),
      });
      const greska = await greskaIz(res);
      if (greska) return greska;
      setKorisnik((await res.json()).korisnik);
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const odjava = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    setKorisnik(null);
    setZaposleni([]);
    setZahtevi([]);
  }, []);

  const dodajZahtev = useCallback<StoreContext["dodajZahtev"]>(
    async (z) => {
      const res = await fetch("/api/zahtevi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(z),
      });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const promeniStatus = useCallback<StoreContext["promeniStatus"]>(
    async (id, status) => {
      const res = await fetch(`/api/zahtevi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const pomeriZahtev = useCallback<StoreContext["pomeriZahtev"]>(
    async (id, datumOd, datumDo) => {
      const res = await fetch(`/api/zahtevi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datumOd, datumDo }),
      });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const obrisiZahtev = useCallback<StoreContext["obrisiZahtev"]>(
    async (id) => {
      const res = await fetch(`/api/zahtevi/${id}`, { method: "DELETE" });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const dodajZaposlenog = useCallback<StoreContext["dodajZaposlenog"]>(
    async (z) => {
      const res = await fetch("/api/zaposleni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(z),
      });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const azurirajProfil = useCallback<StoreContext["azurirajProfil"]>(
    async (id, podaci) => {
      const res = await fetch(`/api/zaposleni/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(podaci),
      });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const promeniLozinku = useCallback<StoreContext["promeniLozinku"]>(
    async (id, podaci) => {
      const res = await fetch(`/api/zaposleni/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(podaci),
      });
      return greskaIz(res);
    },
    [],
  );

  const obrisiZaposlenog = useCallback<StoreContext["obrisiZaposlenog"]>(
    async (id) => {
      const res = await fetch(`/api/zaposleni/${id}`, { method: "DELETE" });
      const greska = await greskaIz(res);
      if (greska) return greska;
      await ucitajPodatke();
      return null;
    },
    [ucitajPodatke],
  );

  const api = useMemo<StoreContext>(
    () => ({
      zaposleni,
      zahtevi,
      trenutniKorisnik,
      ucitano,
      prijava,
      odjava,
      dodajZahtev,
      promeniStatus,
      pomeriZahtev,
      obrisiZahtev,
      dodajZaposlenog,
      azurirajProfil,
      promeniLozinku,
      obrisiZaposlenog,
    }),
    [
      zaposleni,
      zahtevi,
      trenutniKorisnik,
      ucitano,
      prijava,
      odjava,
      dodajZahtev,
      promeniStatus,
      pomeriZahtev,
      obrisiZahtev,
      dodajZaposlenog,
      azurirajProfil,
      promeniLozinku,
      obrisiZaposlenog,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore mora biti unutar StoreProvider");
  return ctx;
}
