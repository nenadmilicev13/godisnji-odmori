"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Zaposleni, ZahtevZaOdsustvo, StatusZahteva } from "./types";
import {
  ucitajZaposlene,
  ucitajZahteve,
  sacuvajZaposlene,
  sacuvajZahteve,
} from "./storage";
import { generisiId } from "./utils";

interface StoreContext {
  zaposleni: Zaposleni[];
  zahtevi: ZahtevZaOdsustvo[];
  ucitano: boolean;
  dodajZahtev: (z: Omit<ZahtevZaOdsustvo, "id" | "kreirano" | "status">) => void;
  promeniStatus: (id: string, status: StatusZahteva) => void;
  obrisiZahtev: (id: string) => void;
  dodajZaposlenog: (z: Omit<Zaposleni, "id">) => void;
  obrisiZaposlenog: (id: string) => void;
}

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [zaposleni, setZaposleni] = useState<Zaposleni[]>([]);
  const [zahtevi, setZahtevi] = useState<ZahtevZaOdsustvo[]>([]);
  const [ucitano, setUcitano] = useState(false);

  // Inicijalno učitavanje iz localStorage
  useEffect(() => {
    setZaposleni(ucitajZaposlene());
    setZahtevi(ucitajZahteve());
    setUcitano(true);
  }, []);

  // Perzistencija
  useEffect(() => {
    if (ucitano) sacuvajZaposlene(zaposleni);
  }, [zaposleni, ucitano]);

  useEffect(() => {
    if (ucitano) sacuvajZahteve(zahtevi);
  }, [zahtevi, ucitano]);

  const api = useMemo<StoreContext>(
    () => ({
      zaposleni,
      zahtevi,
      ucitano,
      dodajZahtev: (z) =>
        setZahtevi((prev) => [
          {
            ...z,
            id: generisiId(),
            status: "na_cekanju",
            kreirano: new Date().toISOString(),
          },
          ...prev,
        ]),
      promeniStatus: (id, status) =>
        setZahtevi((prev) =>
          prev.map((z) => (z.id === id ? { ...z, status } : z)),
        ),
      obrisiZahtev: (id) =>
        setZahtevi((prev) => prev.filter((z) => z.id !== id)),
      dodajZaposlenog: (z) =>
        setZaposleni((prev) => [...prev, { ...z, id: generisiId() }]),
      obrisiZaposlenog: (id) =>
        setZaposleni((prev) => prev.filter((z) => z.id !== id)),
    }),
    [zaposleni, zahtevi, ucitano],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore mora biti unutar StoreProvider");
  return ctx;
}
