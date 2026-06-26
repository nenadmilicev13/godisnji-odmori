import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trenutniKorisnik, javniZaposleni, javniZahtev } from "@/lib/auth-server";
import { jeAdmin } from "@/lib/types";

/** Vraćanje iz korpe — admin bilo koji, zaposleni samo svoj. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const zahtev = await prisma.zahtev.findUnique({ where: { id: params.id } });
  if (!zahtev) {
    return NextResponse.json({ greska: "Zahtev ne postoji." }, { status: 404 });
  }

  const admin = jeAdmin(javniZaposleni(ja));
  if (!admin && zahtev.zaposleniId !== ja.id) {
    return NextResponse.json(
      { greska: "Možete vratiti samo sopstveni zahtev." },
      { status: 403 },
    );
  }

  const vracen = await prisma.zahtev.update({
    where: { id: params.id },
    data: { obrisanoKad: null },
  });
  return NextResponse.json({ zahtev: javniZahtev(vracen) });
}
