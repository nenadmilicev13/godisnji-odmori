"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  TipOdsustva,
  TIP_LABELE,
  jeAdmin,
  trosiFond,
  tipoviZaUnos,
} from "@/lib/types";
import { brojRadnihDana, danas, iskorisceniGodisnji } from "@/lib/utils";

interface Props {
  onGotovo: () => void;
}

export default function ZahtevForma({ onGotovo }: Props) {
  const { zaposleni, zahtevi, trenutniKorisnik, dodajZahtev } = useStore();
  const admin = jeAdmin(trenutniKorisnik);

  // Ne-admin može da unese zahtev samo za sebe.
  const [zaposleniId, setZaposleniId] = useState(
    admin ? (zaposleni[0]?.id ?? "") : (trenutniKorisnik?.id ?? ""),
  );
  const [tip, setTip] = useState<TipOdsustva>("godisnji");
  const [datumOd, setDatumOd] = useState(danas());
  const [datumDo, setDatumDo] = useState(danas());
  const [napomena, setNapomena] = useState("");
  const [greska, setGreska] = useState("");
  const [salje, setSalje] = useState(false);

  const radniDani = brojRadnihDana(datumOd, datumDo);

  // Stanje godišnjeg fonda za izabranog zaposlenog (samo informativno; server proverava).
  const izabrani = zaposleni.find((z) => z.id === zaposleniId);
  const iskorisceno = izabrani ? iskorisceniGodisnji(zahtevi, izabrani.id) : 0;
  const preostalo = izabrani ? izabrani.brojDanaGodisnjeg - iskorisceno : 0;
  const prekoracenje = trosiFond(tip) && izabrani && radniDani > preostalo;

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (!zaposleniId) return setGreska("Izaberite zaposlenog.");
    if (new Date(datumOd) > new Date(datumDo))
      return setGreska("Datum „od“ ne može biti posle datuma „do“.");

    setGreska("");
    setSalje(true);
    const g = await dodajZahtev({ zaposleniId, tip, datumOd, datumDo, napomena });
    setSalje(false);
    if (g) return setGreska(g);
    onGotovo();
  }

  return (
    <form onSubmit={posalji} className="space-y-4">
      <div>
        <label className="label">Zaposleni</label>
        {admin ? (
          <select
            className="input"
            value={zaposleniId}
            onChange={(e) => setZaposleniId(e.target.value)}
          >
            {zaposleni.map((z) => (
              <option key={z.id} value={z.id}>
                {z.ime} — {z.pozicija}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="input bg-slate-50 text-slate-500"
            value={`${trenutniKorisnik?.ime} — ${trenutniKorisnik?.pozicija}`}
            disabled
          />
        )}
      </div>

      <div>
        <label className="label">Tip odsustva</label>
        <select
          className="input"
          value={tip}
          onChange={(e) => setTip(e.target.value as TipOdsustva)}
        >
          {tipoviZaUnos(admin).map((k) => (
            <option key={k} value={k}>
              {TIP_LABELE[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Datum od</label>
          <input
            type="date"
            className="input"
            value={datumOd}
            onChange={(e) => setDatumOd(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Datum do</label>
          <input
            type="date"
            className="input"
            value={datumDo}
            min={datumOd}
            onChange={(e) => setDatumDo(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
        Trajanje:{" "}
        <span className="font-semibold">
          {radniDani} {radniDani === 1 ? "radni dan" : "radnih dana"}
        </span>{" "}
        <span className="text-brand-400">(bez vikenda i praznika)</span>
        {trosiFond(tip) && izabrani && (
          <div
            className={`mt-1 text-xs ${prekoracenje ? "font-medium text-rose-600" : "text-brand-500"}`}
          >
            Godišnji fond: preostalo {preostalo} od {izabrani.brojDanaGodisnjeg} dana
            {prekoracenje && " — prekoračujete fond!"}
          </div>
        )}
      </div>

      <div>
        <label className="label">Napomena (opciono)</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={napomena}
          placeholder="Dodatne informacije..."
          onChange={(e) => setNapomena(e.target.value)}
        />
      </div>

      {greska && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {greska}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-ghost" onClick={onGotovo}>
          Otkaži
        </button>
        <button type="submit" className="btn-primary" disabled={salje}>
          {salje ? "Čuvanje..." : "Sačuvaj zahtev"}
        </button>
      </div>
    </form>
  );
}
