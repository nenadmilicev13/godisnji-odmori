import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trenutniKorisnik, javniZaposleni } from "@/lib/auth-server";
import { jeAdmin } from "@/lib/types";

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
