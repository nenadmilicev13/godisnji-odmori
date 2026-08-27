import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { procitajOdlukaToken } from "@/lib/odluka-token";
import { mejlStatus } from "@/lib/email";
import { StatusZahteva, TipOdsustva } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Odobravanje/odbijanje iz mejla. Namerno POST — GET nikada ne menja stanje,
 * da skeneri i pretučitavanje linkova u mejl klijentima ne mogu da odluče
 * umesto šefa.
 */
export async function POST(req: NextRequest) {
  const forma = await req.formData().catch(() => null);
  const token = String(forma?.get("token") ?? "");
  const akcija = String(forma?.get("akcija") ?? "");

  const podaci = await procitajOdlukaToken(token);
  if (!podaci) {
    return odgovor("Link nije važeći", "Link je istekao ili je neispravan. Prijavi se u aplikaciju i odluči tamo.", false);
  }
  if (akcija !== "odobreno" && akcija !== "odbijeno") {
    return odgovor("Nepoznata akcija", "Pokušaj ponovo iz mejla.", false);
  }

  const [zahtev, admin] = await Promise.all([
    prisma.zahtev.findUnique({ where: { id: podaci.zid } }),
    prisma.zaposleni.findUnique({ where: { id: podaci.aid } }),
  ]);

  if (!admin || admin.uloga !== "sef") {
    return odgovor("Nemaš dozvolu", "Odluku može doneti samo šef.", false);
  }
  if (!zahtev || zahtev.obrisanoKad) {
    return odgovor("Zahtev ne postoji", "Zahtev je u međuvremenu obrisan.", false);
  }
  if (zahtev.status !== "na_cekanju") {
    const vec = zahtev.status === "odobreno" ? "odobren" : "odbijen";
    return odgovor("Već obrađeno", `Ovaj zahtev je već ${vec}.`, true);
  }

  const status = akcija as StatusZahteva;
  const azuriran = await prisma.zahtev.update({
    where: { id: zahtev.id },
    data: { status },
  });

  const odobren = status === "odobreno";

  // Obavesti podnosioca (in-app + mejl), isto kao iz aplikacije.
  if (azuriran.zaposleniId !== admin.id) {
    await prisma.notifikacija.create({
      data: {
        korisnikId: azuriran.zaposleniId,
        tekst: `Vaš zahtev (${azuriran.datumOd} – ${azuriran.datumDo}) je ${odobren ? "odobren ✅" : "odbijen"}.`,
        link: "pregled",
      },
    });
    const podnosilac = await prisma.zaposleni.findUnique({
      where: { id: azuriran.zaposleniId },
    });
    if (podnosilac) {
      await mejlStatus({
        email: podnosilac.email,
        ime: podnosilac.ime,
        odobreno: odobren,
        datumOd: azuriran.datumOd,
        datumDo: azuriran.datumDo,
        tip: azuriran.tip as TipOdsustva,
      });
    }
  }

  return odgovor(
    odobren ? "Zahtev je odobren" : "Zahtev je odbijen",
    odobren
      ? "Zaposleni je obavešten mejlom."
      : "Zaposleni je obavešten mejlom.",
    true,
  );
}

/** Mala HTML stranica sa ishodom — otvara se u browseru posle klika. */
function odgovor(naslov: string, tekst: string, uspeh: boolean) {
  const boja = uspeh ? "#10b981" : "#f43f5e";
  const html = `<!doctype html>
<html lang="sr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${naslov}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:460px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;text-align:center;">
    <div style="width:100%;height:4px;background:${boja};border-radius:2px;margin-bottom:24px;"></div>
    <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">${naslov}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#64748b;">${tekst}</p>
    <a href="/" style="display:inline-block;padding:11px 22px;border-radius:8px;background:#4f46e5;color:#fff;font-weight:600;font-size:14px;text-decoration:none;">Otvori aplikaciju</a>
  </div>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
