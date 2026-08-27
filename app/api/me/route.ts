import { NextResponse } from "next/server";
import { trenutniKorisnik, javniZaposleni } from "@/lib/auth-server";
import { kalendarToken } from "@/lib/ics";

export async function GET() {
  const z = await trenutniKorisnik();
  return NextResponse.json({
    korisnik: z ? javniZaposleni(z) : null,
    // Token za pretplatu na .ics kalendar — vidi lib/ics.ts.
    kalendarToken: z ? kalendarToken(z.id) : null,
  });
}
