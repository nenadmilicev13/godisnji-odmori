import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trenutniKorisnik, javniZaposleni } from "@/lib/auth-server";
import { jeAdmin } from "@/lib/types";

/** Izmena profila (rođendan, slava) — vlasnik naloga ili admin. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const admin = jeAdmin(javniZaposleni(ja));
  if (!admin && ja.id !== params.id) {
    return NextResponse.json(
      { greska: "Možete menjati samo sopstveni profil." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const rodjendan =
    typeof body.rodjendan === "string" && body.rodjendan ? body.rodjendan : null;
  const slava =
    typeof body.slava === "string" && body.slava.trim() ? body.slava.trim() : null;

  const azuriran = await prisma.zaposleni.update({
    where: { id: params.id },
    data: { rodjendan, slava },
  });
  return NextResponse.json({ zaposleni: javniZaposleni(azuriran) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ja = await trenutniKorisnik();
  if (!jeAdmin(ja ? javniZaposleni(ja) : null)) {
    return NextResponse.json({ greska: "Samo admin može brisati zaposlene." }, { status: 403 });
  }
  if (ja!.id === params.id) {
    return NextResponse.json({ greska: "Ne možete obrisati sopstveni nalog." }, { status: 400 });
  }

  await prisma.zaposleni.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
