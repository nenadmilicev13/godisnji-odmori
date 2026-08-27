"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { jeAdmin } from "@/lib/types";
import Modal from "@/components/Modal";
import ZahtevForma from "@/components/ZahtevForma";
import ZahteviLista from "@/components/ZahteviLista";
import ZaposleniLista from "@/components/ZaposleniLista";
import KalendarPrikaz from "@/components/KalendarPrikaz";
import KoJeOdsutan from "@/components/KoJeOdsutan";
import RodjendaniSlave from "@/components/RodjendaniSlave";
import LoginPage from "@/components/LoginPage";
import Logo from "@/components/Logo";
import Korpa from "@/components/Korpa";
import ToastUndo from "@/components/ToastUndo";
import Zvonce from "@/components/Zvonce";

type Tab = "pregled" | "kalendar" | "zaposleni" | "korpa";

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
            <Zvonce />
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
        {/* Rođendani i slave */}
        <RodjendaniSlave />

        {/* Ko je odsutan */}
        <KoJeOdsutan />

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
          {admin && (
            <button
              onClick={() => setTab("korpa")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "korpa"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🗑️ Korpa
            </button>
          )}
        </div>

        <div className="animate-fade-in">
          {tab === "pregled" ? (
            <ZahteviLista />
          ) : tab === "kalendar" ? (
            <KalendarPrikaz />
          ) : tab === "korpa" && admin ? (
            <Korpa />
          ) : (
            <ZaposleniLista />
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
        Godišnji odmori · Baseline
      </footer>

      <Modal
        otvoren={formaOtvorena}
        naslov="Novi zahtev za odsustvo"
        onZatvori={() => setFormaOtvorena(false)}
      >
        <ZahtevForma onGotovo={() => setFormaOtvorena(false)} />
      </Modal>

      <ToastUndo />
    </div>
  );
}
