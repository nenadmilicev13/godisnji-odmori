import { NextResponse } from "next/server";
import { trenutniKorisnik, javniZaposleni } from "@/lib/auth-server";

export async function GET() {
  const z = await trenutniKorisnik();
  return NextResponse.json({ korisnik: z ? javniZaposleni(z) : null });
}
