import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { trenutniKorisnik, javniZaposleni } from "@/lib/auth-server";
import { jeAdmin } from "@/lib/types";

/** Izmena profila (ime, rođendan, slava, lozinka) — vlasnik naloga ili admin. */
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

  // ——— Promena lozinke ———
  if (typeof body.novaLozinka === "string" && body.novaLozinka) {
    if (body.novaLozinka.length < 6) {
      return NextResponse.json(
        { greska: "Lozinka mora imati bar 6 karaktera." },
        { status: 400 },
      );
    }
    // Vlasnik mora potvrditi trenutnu lozinku; admin može da resetuje tuđu bez nje.
    if (ja.id === params.id) {
      const me = await prisma.zaposleni.findUnique({ where: { id: params.id } });
      if (!me || !(await bcrypt.compare(String(body.staraLozinka ?? ""), me.lozinkaHash))) {
        return NextResponse.json(
          { greska: "Trenutna lozinka nije tačna." },
          { status: 403 },
        );
      }
    }
    await prisma.zaposleni.update({
      where: { id: params.id },
      data: { lozinkaHash: await bcrypt.hash(body.novaLozinka, 10) },
    });
    return NextResponse.json({ ok: true });
  }

  const data: {
    ime?: string;
    rodjendan?: string | null;
    slava?: string | null;
    slika?: string | null;
  } = {};

  if ("slika" in body) {
    data.slika =
      typeof body.slika === "string" && body.slika ? body.slika : null;
  }

  if (typeof body.ime === "string") {
    const ime = body.ime.trim();
    if (!ime) {
      return NextResponse.json({ greska: "Ime ne može biti prazno." }, { status: 400 });
    }
    data.ime = ime;
  }
  if ("rodjendan" in body) {
    data.rodjendan =
      typeof body.rodjendan === "string" && body.rodjendan ? body.rodjendan : null;
  }
  if ("slava" in body) {
    data.slava =
      typeof body.slava === "string" && body.slava.trim() ? body.slava.trim() : null;
  }

  const azuriran = await prisma.zaposleni.update({
    where: { id: params.id },
    data,
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
