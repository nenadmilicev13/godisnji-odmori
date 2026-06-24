import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  trenutniKorisnik,
  javniZaposleni,
  javniZahtev,
} from "@/lib/auth-server";
import { jeAdmin, StatusZahteva } from "@/lib/types";
import {
  pronadjiKonfliktDizajnera,
  iskorisceniGodisnji,
  brojRadnihDana,
} from "@/lib/utils";
import { mejlStatus } from "@/lib/email";

/** Odobravanje/odbijanje — samo admin. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!jeAdmin(ja ? javniZaposleni(ja) : null)) {
    return NextResponse.json(
      { greska: "Samo admin može da odobrava ili odbija zahteve." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const status = body.status as StatusZahteva;
  if (!["na_cekanju", "odobreno", "odbijeno"].includes(status)) {
    return NextResponse.json({ greska: "Neispravan status." }, { status: 400 });
  }

  const zahtev = await prisma.zahtev.findUnique({ where: { id: params.id } });
  if (!zahtev) {
    return NextResponse.json({ greska: "Zahtev ne postoji." }, { status: 404 });
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
    if (zahtev.tip === "godisnji") {
      const podnosilac = sviZaposleni.find((z) => z.id === zahtev.zaposleniId);
      const iskorisceno = iskorisceniGodisnji(
        sviZahtevi.map(javniZahtev),
        zahtev.zaposleniId,
      );
      const trazeno = brojRadnihDana(zahtev.datumOd, zahtev.datumDo);
      if (podnosilac && iskorisceno + trazeno > podnosilac.brojDanaGodisnjeg) {
        const preostalo = podnosilac.brojDanaGodisnjeg - iskorisceno;
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

/** Brisanje — admin bilo koji, zaposleni samo svoj. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const zahtev = await prisma.zahtev.findUnique({ where: { id: params.id } });
  if (!zahtev) return NextResponse.json({ ok: true });

  const admin = jeAdmin(javniZaposleni(ja));
  if (!admin && zahtev.zaposleniId !== ja.id) {
    return NextResponse.json(
      { greska: "Možete obrisati samo sopstveni zahtev." },
      { status: 403 },
    );
  }

  await prisma.zahtev.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
