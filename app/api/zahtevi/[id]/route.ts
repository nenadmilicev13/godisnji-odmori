import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  trenutniKorisnik,
  javniZaposleni,
  javniZahtev,
} from "@/lib/auth-server";
import { jeAdmin, trosiFond, StatusZahteva, TipOdsustva } from "@/lib/types";
import {
  pronadjiKonfliktDizajnera,
  zauzetiGodisnji,
  brojRadnihDana,
} from "@/lib/utils";
import { mejlStatus } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });
  const admin = jeAdmin(javniZaposleni(ja));

  const body = await req.json().catch(() => ({}));

  const zahtev = await prisma.zahtev.findUnique({ where: { id: params.id } });
  if (!zahtev) {
    return NextResponse.json({ greska: "Zahtev ne postoji." }, { status: 404 });
  }

  // ——— Izmena zahteva (tip/datumi/napomena) — vlasnik ili admin, samo pre odobrenja ———
  if (typeof body.status !== "string") {
    const jeVlasnik = zahtev.zaposleniId === ja.id;
    if (!admin && !jeVlasnik) {
      return NextResponse.json(
        { greska: "Možete menjati samo svoj zahtev." },
        { status: 403 },
      );
    }
    if (zahtev.status !== "na_cekanju") {
      return NextResponse.json(
        { greska: "Zahtev je već obrađen i ne može se menjati." },
        { status: 409 },
      );
    }

    const tip = typeof body.tip === "string" ? body.tip : zahtev.tip;
    const datumOd = typeof body.datumOd === "string" ? body.datumOd : zahtev.datumOd;
    const datumDo = typeof body.datumDo === "string" ? body.datumDo : zahtev.datumDo;
    const napomena =
      typeof body.napomena === "string" ? body.napomena : zahtev.napomena;

    if (tip === "nagradni_dan" && !admin) {
      return NextResponse.json(
        { greska: "Nagradni dan može dodeliti samo admin." },
        { status: 403 },
      );
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

    const konflikt = pronadjiKonfliktDizajnera(
      javniZahtevi,
      sviZaposleni.map(javniZaposleni),
      { zaposleniId: zahtev.zaposleniId, datumOd, datumDo, ignorirajZahtevId: zahtev.id },
    );
    if (konflikt) {
      return NextResponse.json(
        {
          greska: `Preklapanje: ${konflikt.zaposleni.ime} već ima odsustvo ${konflikt.zahtev.datumOd} – ${konflikt.zahtev.datumDo}.`,
        },
        { status: 409 },
      );
    }

    if (trosiFond(tip as TipOdsustva)) {
      const podnosilac = sviZaposleni.find((z) => z.id === zahtev.zaposleniId);
      const zauzeto = zauzetiGodisnji(javniZahtevi, zahtev.zaposleniId, zahtev.id);
      const trazeno = brojRadnihDana(datumOd, datumDo);
      if (podnosilac && zauzeto + trazeno > podnosilac.brojDanaGodisnjeg) {
        const preostalo = podnosilac.brojDanaGodisnjeg - zauzeto;
        return NextResponse.json(
          {
            greska: `Prekoračen fond: ${trazeno} dana, a preostalo je ${preostalo} od ${podnosilac.brojDanaGodisnjeg}.`,
          },
          { status: 409 },
        );
      }
    }

    const azuriran = await prisma.zahtev.update({
      where: { id: params.id },
      data: { tip, datumOd, datumDo, napomena },
    });
    return NextResponse.json({ zahtev: javniZahtev(azuriran) });
  }

  // ——— Promena statusa (odobri/odbij) — samo admin ———
  if (!admin) {
    return NextResponse.json(
      { greska: "Samo admin može da odobrava ili odbija zahteve." },
      { status: 403 },
    );
  }
  const status = body.status as StatusZahteva;
  if (!["na_cekanju", "odobreno", "odbijeno"].includes(status)) {
    return NextResponse.json({ greska: "Neispravan status." }, { status: 400 });
  }

  // Pri odobravanju: spreči koliziju sa već odobrenim odsustvom drugog dizajnera.
  if (status === "odobreno") {
    const [sviZahtevi, sviZaposleni] = await Promise.all([
      prisma.zahtev.findMany(),
      prisma.zaposleni.findMany(),
    ]);
    const konflikt = pronadjiKonfliktDizajnera(
      sviZahtevi.map(javniZahtev),
      sviZaposleni.map(javniZaposleni),
      {
        zaposleniId: zahtev.zaposleniId,
        datumOd: zahtev.datumOd,
        datumDo: zahtev.datumDo,
        ignorirajZahtevId: zahtev.id,
      },
      ["odobreno"],
    );
    if (konflikt) {
      return NextResponse.json(
        {
          greska: `Ne može se odobriti: ${konflikt.zaposleni.ime} već ima odobreno odsustvo ${konflikt.zahtev.datumOd} – ${konflikt.zahtev.datumDo}.`,
        },
        { status: 409 },
      );
    }

    // Kontrola godišnjeg fonda pri odobravanju (samo "godisnji").
    if (trosiFond(zahtev.tip as TipOdsustva)) {
      const podnosilac = sviZaposleni.find((z) => z.id === zahtev.zaposleniId);
      const zauzeto = zauzetiGodisnji(
        sviZahtevi.map(javniZahtev),
        zahtev.zaposleniId,
        zahtev.id,
      );
      const trazeno = brojRadnihDana(zahtev.datumOd, zahtev.datumDo);
      if (podnosilac && zauzeto + trazeno > podnosilac.brojDanaGodisnjeg) {
        const preostalo = podnosilac.brojDanaGodisnjeg - zauzeto;
        return NextResponse.json(
          {
            greska: `Prekoračen godišnji fond: ovaj zahtev je ${trazeno} dana, a preostalo je ${preostalo} od ${podnosilac.brojDanaGodisnjeg}.`,
          },
          { status: 409 },
        );
      }
    }
  }

  const azuriran = await prisma.zahtev.update({
    where: { id: params.id },
    data: { status },
  });

  // Obavesti zaposlenog o ishodu (best-effort).
  if (status === "odobreno" || status === "odbijeno") {
    const podnosilac = await prisma.zaposleni.findUnique({
      where: { id: azuriran.zaposleniId },
    });
    if (podnosilac) {
      await mejlStatus({
        email: podnosilac.email,
        ime: podnosilac.ime,
        odobreno: status === "odobreno",
        datumOd: azuriran.datumOd,
        datumDo: azuriran.datumDo,
      });
    }
  }

  return NextResponse.json({ zahtev: javniZahtev(azuriran) });
}

/** Brisanje — admin bilo koji; zaposleni samo svoj i samo dok je „na čekanju". */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const zahtev = await prisma.zahtev.findUnique({ where: { id: params.id } });
  if (!zahtev) return NextResponse.json({ ok: true });

  const admin = jeAdmin(javniZaposleni(ja));
  if (!admin) {
    if (zahtev.zaposleniId !== ja.id) {
      return NextResponse.json(
        { greska: "Možete obrisati samo sopstveni zahtev." },
        { status: 403 },
      );
    }
    if (zahtev.status !== "na_cekanju") {
      return NextResponse.json(
        { greska: "Odobren zahtev ne možete obrisati — obratite se šefu." },
        { status: 409 },
      );
    }
  }

  await prisma.zahtev.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
