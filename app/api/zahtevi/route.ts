import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  trenutniKorisnik,
  javniZaposleni,
  javniZahtev,
} from "@/lib/auth-server";
import { jeAdmin } from "@/lib/types";
import { pronadjiKonfliktDizajnera } from "@/lib/utils";

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

  // Provera preklapanja dizajnera (na serveru) — protiv neodbijenih zahteva.
  const [sviZahtevi, sviZaposleni] = await Promise.all([
    prisma.zahtev.findMany(),
    prisma.zaposleni.findMany(),
  ]);
  const konflikt = pronadjiKonfliktDizajnera(
    sviZahtevi.map(javniZahtev),
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

  const noviz = await prisma.zahtev.create({
    data: { zaposleniId, tip, datumOd, datumDo, napomena, status: "na_cekanju" },
  });
  return NextResponse.json({ zahtev: javniZahtev(noviz) });
}
