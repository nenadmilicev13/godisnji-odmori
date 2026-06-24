import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  trenutniKorisnik,
  javniZaposleni,
  javniZahtev,
} from "@/lib/auth-server";
import { jeAdmin } from "@/lib/types";
import {
  pronadjiKonfliktDizajnera,
  iskorisceniGodisnji,
  brojRadnihDana,
} from "@/lib/utils";
import { mejlNovZahtev } from "@/lib/email";
import { TipOdsustva } from "@/lib/types";

export async function GET() {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const lista = await prisma.zahtev.findMany({ orderBy: { kreirano: "desc" } });
  return NextResponse.json({ zahtevi: lista.map(javniZahtev) });
}

export async function POST(req: NextRequest) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const zaposleniId = String(body.zaposleniId ?? "");
  const datumOd = String(body.datumOd ?? "");
  const datumDo = String(body.datumDo ?? "");
  const tip = String(body.tip ?? "godisnji");
  const napomena = String(body.napomena ?? "");

  // Ne-admin može da kreira zahtev samo za sebe.
  const admin = jeAdmin(javniZaposleni(ja));
  if (!admin && zaposleniId !== ja.id) {
    return NextResponse.json(
      { greska: "Možete kreirati zahtev samo za sebe." },
      { status: 403 },
    );
  }
  if (!zaposleniId || !datumOd || !datumDo) {
    return NextResponse.json({ greska: "Nedostaju podaci." }, { status: 400 });
  }
  if (datumOd > datumDo) {
    return NextResponse.json(
      { greska: "Datum „od“ ne može biti posle datuma „do“." },
      { status: 400 },
    );
  }

  const [sviZahtevi, sviZaposleni] = await Promise.all([
    prisma.zahtev.findMany(),
    prisma.zaposleni.findMany(),
  ]);
  const javniZahtevi = sviZahtevi.map(javniZahtev);

  // 1) Preklapanje dizajnera (protiv neodbijenih zahteva).
  const konflikt = pronadjiKonfliktDizajnera(
    javniZahtevi,
    sviZaposleni.map(javniZaposleni),
    { zaposleniId, datumOd, datumDo },
  );
  if (konflikt) {
    return NextResponse.json(
      {
        greska: `Dva dizajnera ne mogu biti odsutna istovremeno. ${konflikt.zaposleni.ime} već ima odsustvo ${konflikt.zahtev.datumOd} – ${konflikt.zahtev.datumDo}.`,
      },
      { status: 409 },
    );
  }

  // 2) Kontrola godišnjeg fonda (samo za tip "godisnji").
  if (tip === "godisnji") {
    const podnosilac = sviZaposleni.find((z) => z.id === zaposleniId);
    const iskorisceno = iskorisceniGodisnji(javniZahtevi, zaposleniId);
    const trazeno = brojRadnihDana(datumOd, datumDo);
    if (podnosilac && iskorisceno + trazeno > podnosilac.brojDanaGodisnjeg) {
      const preostalo = podnosilac.brojDanaGodisnjeg - iskorisceno;
      return NextResponse.json(
        {
          greska: `Prekoračen godišnji fond: tražite ${trazeno} dana, a preostalo je ${preostalo} od ${podnosilac.brojDanaGodisnjeg}.`,
        },
        { status: 409 },
      );
    }
  }

  const noviz = await prisma.zahtev.create({
    data: { zaposleniId, tip, datumOd, datumDo, napomena, status: "na_cekanju" },
  });

  // Obavesti šefa (best-effort — ne blokira odgovor pri grešci).
  const podnosilac = sviZaposleni.find((z) => z.id === zaposleniId);
  await mejlNovZahtev({
    adminEmails: sviZaposleni.filter((z) => z.uloga === "sef").map((z) => z.email),
    imePodnosioca: podnosilac?.ime ?? "Zaposleni",
    tip: tip as TipOdsustva,
    datumOd,
    datumDo,
  });

  return NextResponse.json({ zahtev: javniZahtev(noviz) });
}
