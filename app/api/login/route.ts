import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { kreirajSesiju } from "@/lib/session";
import { javniZaposleni } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const { email, lozinka } = await req.json().catch(() => ({}));
  if (!email || !lozinka) {
    return NextResponse.json({ greska: "Unesite email i lozinku." }, { status: 400 });
  }

  const z = await prisma.zaposleni.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (!z || !(await bcrypt.compare(String(lozinka), z.lozinkaHash))) {
    return NextResponse.json(
      { greska: "Pogrešan email ili lozinka." },
      { status: 401 },
    );
  }

  await kreirajSesiju(z.id);
  return NextResponse.json({ korisnik: javniZaposleni(z) });
}
