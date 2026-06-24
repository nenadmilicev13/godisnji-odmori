"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { TipOdsustva, TIP_LABELE } from "@/lib/types";
import {
  brojRadnihDana,
  danas,
  formatDatum,
  pronadjiKonfliktDizajnera,
} from "@/lib/utils";

interface Props {
  onGotovo: () => void;
}

export default function ZahtevForma({ onGotovo }: Props) {
  const { zaposleni, zahtevi, dodajZahtev } = useStore();
  const [zaposleniId, setZaposleniId] = useState(zaposleni[0]?.id ?? "");
  const [tip, setTip] = useState<TipOdsustva>("godisnji");
  const [datumOd, setDatumOd] = useState(danas());
  const [datumDo, setDatumDo] = useState(danas());
  const [napomena, setNapomena] = useState("");
  const [greska, setGreska] = useState("");

  const radniDani = brojRadnihDana(datumOd, datumDo);

  function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (!zaposleniId) return setGreska("Izaberite zaposlenog.");
    if (new Date(datumOd) > new Date(datumDo))
      return setGreska("Datum „od“ ne može biti posle datuma „do“.");

    const konflikt = pronadjiKonfliktDizajnera(zahtevi, zaposleni, {
      zaposleniId,
      datumOd,
      datumDo,
    });
    if (konflikt) {
      return setGreska(
        `Dva dizajnera ne mogu biti odsutna istovremeno. ${konflikt.zaposleni.ime} ` +
          `već ima odsustvo u periodu ${formatDatum(konflikt.zahtev.datumOd)} – ` +
          `${formatDatum(konflikt.zahtev.datumDo)}. Izaberite drugi termin.`,
      );
    }

    dodajZahtev({ zaposleniId, tip, datumOd, datumDo, napomena });
    onGotovo();
  }

  return (
    <form onSubmit={posalji} className="space-y-4">
      <div>
        <label className="label">Zaposleni</label>
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
      </div>

      <div>
        <label className="label">Tip odsustva</label>
        <select
          className="input"
          value={tip}
          onChange={(e) => setTip(e.target.value as TipOdsustva)}
        >
          {Object.entries(TIP_LABELE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
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
        <span className="text-brand-400">(bez vikenda)</span>
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
        <button type="submit" className="btn-primary">
          Sačuvaj zahtev
        </button>
      </div>
    </form>
  );
}
