import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trenutniKorisnik, javniNotifikacija } from "@/lib/auth-server";

/** Moje notifikacije (najnovijih 30). */
export async function GET() {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  const lista = await prisma.notifikacija.findMany({
    where: { korisnikId: ja.id },
    orderBy: { kreirano: "desc" },
    take: 30,
  });
  return NextResponse.json({ notifikacije: lista.map(javniNotifikacija) });
}
