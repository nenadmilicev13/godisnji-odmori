import { prisma } from "@/lib/db";
import { procitajOdlukaToken } from "@/lib/odluka-token";
import { TIP_LABELE, TipOdsustva } from "@/lib/types";
import { brojRadnihDana, formatDatum } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Stranica na koju vodi dugme iz mejla. Prikazuje zahtev i dva dugmeta koja
 * šalju POST na /api/odluka. Ništa se ne menja samim otvaranjem stranice.
 */
export default async function OdlukaStranica({
  searchParams,
}: {
  searchParams: { t?: string };
}) {
  const token = searchParams.t ?? "";
  const podaci = await procitajOdlukaToken(token);

  if (!podaci) return <Poruka naslov="Link nije važeći" tekst="Link je istekao ili je neispravan. Prijavi se u aplikaciju i odluči tamo." />;

  const [zahtev, admin] = await Promise.all([
    prisma.zahtev.findUnique({ where: { id: podaci.zid } }),
    prisma.zaposleni.findUnique({ where: { id: podaci.aid } }),
  ]);

  if (!admin || admin.uloga !== "sef")
    return <Poruka naslov="Nemaš dozvolu" tekst="Odluku može doneti samo šef." />;
  if (!zahtev || zahtev.obrisanoKad)
    return <Poruka naslov="Zahtev ne postoji" tekst="Zahtev je u međuvremenu obrisan." />;

  const podnosilac = await prisma.zaposleni.findUnique({
    where: { id: zahtev.zaposleniId },
  });

  if (zahtev.status !== "na_cekanju") {
    const vec = zahtev.status === "odobreno" ? "odobren" : "odbijen";
    return <Poruka naslov="Već obrađeno" tekst={`Ovaj zahtev je već ${vec}.`} />;
  }

  const dana = brojRadnihDana(zahtev.datumOd, zahtev.datumDo);
  const period =
    zahtev.datumOd === zahtev.datumDo
      ? formatDatum(zahtev.datumOd)
      : `${formatDatum(zahtev.datumOd)} – ${formatDatum(zahtev.datumDo)}`;

  return (
    <Okvir>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Baseline · Godišnji odmori
      </p>
      <h1 className="mt-1 text-xl font-bold text-slate-900">Zahtev za odsustvo</h1>

      <dl className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-sm">
        <Red oznaka="Zaposleni" vrednost={podnosilac?.ime ?? "Nepoznat"} prvi />
        <Red oznaka="Tip odsustva" vrednost={TIP_LABELE[zahtev.tip as TipOdsustva]} />
        <Red oznaka="Period" vrednost={period} />
        <Red oznaka="Radnih dana" vrednost={String(dana)} />
        {zahtev.napomena ? <Red oznaka="Napomena" vrednost={zahtev.napomena} /> : null}
      </dl>

      <div className="mt-6 flex gap-3">
        <form action="/api/odluka" method="POST" className="flex-1">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="akcija" value="odobreno" />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Odobri
          </button>
        </form>
        <form action="/api/odluka" method="POST" className="flex-1">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="akcija" value="odbijeno" />
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-50"
          >
            Odbij
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Odlučuješ kao {admin.ime}.
      </p>
    </Okvir>
  );
}

function Okvir({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Red({
  oznaka,
  vrednost,
  prvi,
}: {
  oznaka: string;
  vrednost: string;
  prvi?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 px-4 py-3 ${prvi ? "" : "border-t border-slate-200"}`}>
      <dt className="text-slate-500">{oznaka}</dt>
      <dd className="text-right font-semibold text-slate-900">{vrednost}</dd>
    </div>
  );
}

function Poruka({ naslov, tekst }: { naslov: string; tekst: string }) {
  return (
    <Okvir>
      <h1 className="text-lg font-bold text-slate-900">{naslov}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{tekst}</p>
      <a
        href="/"
        className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Otvori aplikaciju
      </a>
    </Okvir>
  );
}
