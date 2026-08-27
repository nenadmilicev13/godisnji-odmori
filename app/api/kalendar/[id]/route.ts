import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { javniZahtev } from "@/lib/auth-server";
import { napraviIcs, proveriKalendarToken } from "@/lib/ics";

export const dynamic = "force-dynamic";

/**
 * ICS feed sa odobrenim odsustvima tima. Otvara se bez prijave, pa je
 * zaštićen tokenom vezanim za zaposlenog (vidi lib/ics.ts). Namenjen je
 * pretplati iz Google Calendar-a / Apple Calendar-a.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!proveriKalendarToken(params.id, token)) {
    return new NextResponse("Neispravan link.", { status: 403 });
  }

  const ja = await prisma.zaposleni.findUnique({ where: { id: params.id } });
  if (!ja) return new NextResponse("Neispravan link.", { status: 403 });

  const [zahtevi, zaposleni] = await Promise.all([
    prisma.zahtev.findMany({
      where: { obrisanoKad: null, status: "odobreno" },
      orderBy: { datumOd: "asc" },
    }),
    prisma.zaposleni.findMany({ select: { id: true, ime: true } }),
  ]);

  const imena = new Map(zaposleni.map((z) => [z.id, z.ime]));
  const stavke = zahtevi.map((z) => ({
    ...javniZahtev(z),
    imeZaposlenog: imena.get(z.zaposleniId) ?? "Nepoznat",
  }));

  const stamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return new NextResponse(napraviIcs(stavke, stamp), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="godisnji-odmori.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
