"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { brojRadnihDana, iskorisceniGodisnji } from "@/lib/utils";
import { jeAdmin } from "@/lib/types";
import StatCard from "@/components/StatCard";
import Modal from "@/components/Modal";
import ZahtevForma from "@/components/ZahtevForma";
import ZahteviLista from "@/components/ZahteviLista";
import ZaposleniLista from "@/components/ZaposleniLista";
import Kalendar from "@/components/Kalendar";
import KoJeOdsutan from "@/components/KoJeOdsutan";
import RodjendaniSlave from "@/components/RodjendaniSlave";
import LoginPage from "@/components/LoginPage";
import Logo from "@/components/Logo";

type Tab = "pregled" | "kalendar" | "zaposleni";

export default function Home() {
  const { zaposleni, zahtevi, ucitano, trenutniKorisnik, odjava } = useStore();
  const [tab, setTab] = useState<Tab>("pregled");
  const [formaOtvorena, setFormaOtvorena] = useState(false);

  // Dok se ne zna ko je prijavljen — kratko učitavanje.
  if (!ucitano) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Učitavanje...
      </div>
    );
  }

  // Bez prijave — login ekran.
  if (!trenutniKorisnik) return <LoginPage />;

  const admin = jeAdmin(trenutniKorisnik);

  // Timske statistike (admin).
  const naCekanju = zahtevi.filter((z) => z.status === "na_cekanju").length;
  const odobreno = zahtevi.filter((z) => z.status === "odobreno").length;
  const ukupnoDana = zahtevi
    .filter((z) => z.status === "odobreno")
    .reduce((s, z) => s + brojRadnihDana(z.datumOd, z.datumDo), 0);

  // Lične statistike (radnik).
  const moji = zahtevi.filter((z) => z.zaposleniId === trenutniKorisnik.id);
  const mojNaCekanju = moji.filter((z) => z.status === "na_cekanju").length;
  const mojOdobreni = moji.filter((z) => z.status === "odobreno").length;
  const mojIskorisceni = iskorisceniGodisnji(zahtevi, trenutniKorisnik.id);
  const mojPreostalo = trenutniKorisnik.brojDanaGodisnjeg - mojIskorisceni;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-auto text-slate-900" />
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <h1 className="hidden text-sm font-semibold text-slate-600 sm:block">
              Godišnji odmori
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {trenutniKorisnik.ime}
              </p>
              <p className="text-xs text-slate-500">
                {admin ? "Admin (šef)" : trenutniKorisnik.pozicija}
              </p>
            </div>
            <button className="btn-primary" onClick={() => setFormaOtvorena(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="hidden sm:inline">Novi zahtev</span>
            </button>
            <button
              onClick={() => odjava()}
              className="btn-ghost px-3 py-2 text-sm"
              title="Odjavi se"
            >
              Odjava
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Statistika */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {admin ? (
            <>
              <StatCard
                naslov="Zaposlenih"
                vrednost={zaposleni.length}
                ikona={<IkonaLjudi />}
                boja="brand"
              />
              <StatCard
                naslov="Zahteva na čekanju"
                vrednost={naCekanju}
                opis="Čeka odobrenje"
                ikona={<IkonaSat />}
                boja="amber"
              />
              <StatCard
                naslov="Odobrenih zahteva"
                vrednost={odobreno}
                ikona={<IkonaCek />}
                boja="emerald"
              />
              <StatCard
                naslov="Iskorišćeno dana"
                vrednost={ukupnoDana}
                opis="Ceo tim, odobreno"
                ikona={<IkonaKalendar />}
                boja="rose"
              />
            </>
          ) : (
            <>
              <StatCard
                naslov="Preostalo dana"
                vrednost={mojPreostalo}
                opis={`od ${trenutniKorisnik.brojDanaGodisnjeg} dana godišnjeg`}
                ikona={<IkonaKalendar />}
                boja="brand"
              />
              <StatCard
                naslov="Iskorišćeno (godišnji)"
                vrednost={mojIskorisceni}
                opis="Odobreno"
                ikona={<IkonaCek />}
                boja="rose"
              />
              <StatCard
                naslov="Moji na čekanju"
                vrednost={mojNaCekanju}
                opis="Čeka odobrenje"
                ikona={<IkonaSat />}
                boja="amber"
              />
              <StatCard
                naslov="Moji odobreni"
                vrednost={mojOdobreni}
                ikona={<IkonaCek />}
                boja="emerald"
              />
            </>
          )}
        </div>

        {/* Ko je odsutan */}
        <KoJeOdsutan />

        {/* Rođendani i slave */}
        <RodjendaniSlave />

        {/* Tabovi */}
        <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setTab("pregled")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "pregled"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Zahtevi za odsustvo
          </button>
          <button
            onClick={() => setTab("kalendar")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "kalendar"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Kalendar
          </button>
          <button
            onClick={() => setTab("zaposleni")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "zaposleni"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Zaposleni
          </button>
        </div>

        <div className="animate-fade-in">
          {tab === "pregled" ? (
            <ZahteviLista />
          ) : tab === "kalendar" ? (
            <Kalendar />
          ) : (
            <ZaposleniLista />
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
        Godišnji odmori · Podaci se čuvaju lokalno u vašem pregledaču
      </footer>

      <Modal
        otvoren={formaOtvorena}
        naslov="Novi zahtev za odsustvo"
        onZatvori={() => setFormaOtvorena(false)}
      >
        <ZahtevForma onGotovo={() => setFormaOtvorena(false)} />
      </Modal>
    </div>
  );
}

/* — Ikone — */
function IkonaLjudi() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IkonaSat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IkonaCek() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
function IkonaKalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
