import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { trenutniKorisnik, javniZaposleni } from "@/lib/auth-server";
import { jeAdmin, Uloga } from "@/lib/types";

export async function GET() {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const lista = await prisma.zaposleni.findMany({ orderBy: { ime: "asc" } });
  return NextResponse.json({ zaposleni: lista.map(javniZaposleni) });
}

export async function POST(req: NextRequest) {
  const ja = await trenutniKorisnik();
  if (!jeAdmin(ja ? javniZaposleni(ja) : null)) {
    return NextResponse.json({ greska: "Samo admin može dodavati zaposlene." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ime = String(body.ime ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!ime || !email) {
    return NextResponse.json({ greska: "Ime i email su obavezni." }, { status: 400 });
  }

  const postoji = await prisma.zaposleni.findUnique({ where: { email } });
  if (postoji) {
    return NextResponse.json({ greska: "Zaposleni sa tim emailom već postoji." }, { status: 409 });
  }

  const lozinka = String(body.lozinka ?? "123456");
  const noviz = await prisma.zaposleni.create({
    data: {
      ime,
      email,
      pozicija: String(body.pozicija ?? "").trim(),
      uloga: ((body.uloga as Uloga) ?? "ostalo") as string,
      lozinkaHash: await bcrypt.hash(lozinka, 10),
      brojDanaGodisnjeg: Number(body.brojDanaGodisnjeg) || 20,
    },
  });
  return NextResponse.json({ zaposleni: javniZaposleni(noviz) });
}
