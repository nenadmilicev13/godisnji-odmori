import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  trenutniKorisnik,
  javniZaposleni,
  javniZahtev,
} from "@/lib/auth-server";
import { jeAdmin, trosiFond } from "@/lib/types";
import {
  pronadjiKonfliktDizajnera,
  proveriGodisnjiFond,
} from "@/lib/utils";
import { mejlNovZahtev } from "@/lib/email";
import { TipOdsustva, TIP_LABELE } from "@/lib/types";

export async function GET(req: NextRequest) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  // Korpa (obrisani) — samo admin.
  const korpa = new URL(req.url).searchParams.get("korpa") === "1";
  if (korpa) {
    if (!jeAdmin(javniZaposleni(ja))) {
      return NextResponse.json({ greska: "Samo admin." }, { status: 403 });
    }
    const obrisani = await prisma.zahtev.findMany({
      where: { obrisanoKad: { not: null } },
      orderBy: { obrisanoKad: "desc" },
    });
    return NextResponse.json({ zahtevi: obrisani.map(javniZahtev) });
  }

  const lista = await prisma.zahtev.findMany({
    where: { obrisanoKad: null },
    orderBy: { kreirano: "desc" },
  });
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
  // Nagradni dan može dodeliti samo admin.
  if (tip === "nagradni_dan" && !admin) {
    return NextResponse.json(
      { greska: "Nagradni dan može dodeliti samo admin." },
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
    prisma.zahtev.findMany({ where: { obrisanoKad: null } }),
    prisma.zaposleni.findMany(),
  ]);
  const javniZahtevi = sviZahtevi.map(javniZahtev);

  // 1) Preklapanje dizajnera — NE blokira; šef dobija notifikaciju i odlučuje.
  const konflikt = pronadjiKonfliktDizajnera(
    javniZahtevi,
    sviZaposleni.map(javniZaposleni),
    { zaposleniId, datumOd, datumDo },
  );

  // 2) Kontrola godišnjeg fonda — po kalendarskoj godini.
  if (trosiFond(tip as TipOdsustva)) {
    const podnosilac = sviZaposleni.find((z) => z.id === zaposleniId);
    if (podnosilac) {
      const greskaFond = proveriGodisnjiFond(
        javniZahtevi,
        podnosilac,
        datumOd,
        datumDo,
      );
      if (greskaFond) {
        return NextResponse.json({ greska: greskaFond }, { status: 409 });
      }
    }
  }

  // Nagradni dan koji dodeljuje admin je odmah odobren.
  const status = admin && tip === "nagradni_dan" ? "odobreno" : "na_cekanju";
  const noviz = await prisma.zahtev.create({
    data: { zaposleniId, tip, datumOd, datumDo, napomena, status },
  });

  const podnosilac = sviZaposleni.find((z) => z.id === zaposleniId);
  const admini = sviZaposleni.filter((z) => z.uloga === "sef" && z.id !== ja.id);

  // In-app notifikacija šefovima (osim nagradnog dana koji admin sam dodaje).
  if (status === "na_cekanju" && admini.length) {
    const tekst = konflikt
      ? `⚠️ Preklapanje: ${podnosilac?.ime ?? "Zaposleni"} i ${konflikt.zaposleni.ime} traže isti termin (${datumOd} – ${datumDo}). Odlučite.`
      : `Nov zahtev: ${podnosilac?.ime ?? "Zaposleni"} — ${TIP_LABELE[tip as TipOdsustva]} (${datumOd} – ${datumDo})`;
    await prisma.notifikacija.createMany({
      data: admini.map((a) => ({ korisnikId: a.id, tekst, link: "pregled" })),
    });
  }

  // Email šefovima (best-effort — uspavano dok nema RESEND_API_KEY).
  await mejlNovZahtev({
    adminEmails: admini.map((z) => z.email),
    imePodnosioca: podnosilac?.ime ?? "Zaposleni",
    tip: tip as TipOdsustva,
    datumOd,
    datumDo,
  });

  return NextResponse.json({ zahtev: javniZahtev(noviz) });
}
