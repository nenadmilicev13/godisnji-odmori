import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trenutniKorisnik } from "@/lib/auth-server";

/** Označi sve moje notifikacije kao pročitane. */
export async function POST() {
  const ja = await trenutniKorisnik();
  if (!ja) return NextResponse.json({ greska: "Niste prijavljeni." }, { status: 401 });

  await prisma.notifikacija.updateMany({
    where: { korisnikId: ja.id, procitano: false },
    data: { procitano: true },
  });
  return NextResponse.json({ ok: true });
}
