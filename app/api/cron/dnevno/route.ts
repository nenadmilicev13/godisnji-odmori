import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TipOdsustva } from "@/lib/types";
import {
  mejlNedeljniPregled,
  mejlPodsetnikNaCekanju,
  StavkaPregleda,
} from "@/lib/email";
import { napraviOdlukaToken } from "@/lib/odluka-token";

export const dynamic = "force-dynamic";

/** Zahtev na čekanju stariji od ovoliko dana pokreće podsetnik šefu. */
const PRAG_CEKANJA_DANA = 2;

function iso(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Ponedeljak i nedelja tekuće nedelje. */
function nedelja(danas: Date): { od: string; do_: string } {
  const dan = danas.getDay(); // 0 = nedelja
  const pomak = dan === 0 ? -6 : 1 - dan;
  const pon = new Date(danas);
  pon.setDate(danas.getDate() + pomak);
  const ned = new Date(pon);
  ned.setDate(pon.getDate() + 6);
  return { od: iso(pon), do_: iso(ned) };
}

/**
 * Dnevni cron (vidi vercel.json). Ponedeljkom šalje timu pregled odsustava
 * za tu nedelju; svakog dana podseća šefa na zahteve koji predugo čekaju.
 */
export async function GET(req: NextRequest) {
  // Vercel Cron šalje `Authorization: Bearer $CRON_SECRET`.
  const tajna = process.env.CRON_SECRET;
  if (tajna) {
    const zaglavlje = req.headers.get("authorization");
    if (zaglavlje !== `Bearer ${tajna}`) {
      return NextResponse.json({ greska: "Neovlašćeno." }, { status: 401 });
    }
  }

  const danas = new Date();
  const { od, do_ } = nedelja(danas);

  const [zaposleni, odobreni, naCekanju] = await Promise.all([
    prisma.zaposleni.findMany(),
    prisma.zahtev.findMany({
      where: {
        obrisanoKad: null,
        status: "odobreno",
        datumOd: { lte: do_ },
        datumDo: { gte: od },
      },
      orderBy: { datumOd: "asc" },
    }),
    prisma.zahtev.findMany({
      where: { obrisanoKad: null, status: "na_cekanju" },
      orderBy: { kreirano: "asc" },
    }),
  ]);

  const ime = (id: string) =>
    zaposleni.find((z) => z.id === id)?.ime ?? "Nepoznat";
  const uStavku = (z: {
    zaposleniId: string;
    tip: string;
    datumOd: string;
    datumDo: string;
  }): StavkaPregleda => ({
    ime: ime(z.zaposleniId),
    tip: z.tip as TipOdsustva,
    datumOd: z.datumOd,
    datumDo: z.datumDo,
  });

  const rezultat: Record<string, number> = { pregled: 0, podsetnik: 0 };

  // 1) Ponedeljkom — pregled nedelje celom timu.
  if (danas.getDay() === 1 && odobreni.length) {
    await mejlNedeljniPregled({
      primaoci: zaposleni.map((z) => z.email).filter(Boolean),
      odDatum: od,
      doDatum: do_,
      stavke: odobreni.map(uStavku),
    });
    rezultat.pregled = odobreni.length;
  }

  // 2) Svakog dana — zahtevi koji predugo čekaju odluku.
  const granica = new Date(danas);
  granica.setDate(danas.getDate() - PRAG_CEKANJA_DANA);
  const stari = naCekanju.filter((z) => z.kreirano < granica);

  if (stari.length) {
    const admini = zaposleni.filter((z) => z.uloga === "sef");
    const osnova = process.env.APP_URL || new URL(req.url).origin;
    const primaoci = await Promise.all(
      admini.map(async (a) => ({
        email: a.email,
        // Direktan link ima smisla samo kad je zahtev jedan.
        odlukaUrl:
          stari.length === 1
            ? `${osnova}/odluka?t=${await napraviOdlukaToken({ zid: stari[0].id, aid: a.id })}`
            : undefined,
      })),
    );
    await mejlPodsetnikNaCekanju({
      admini: primaoci,
      stavke: stari.map(uStavku),
    });
    rezultat.podsetnik = stari.length;
  }

  return NextResponse.json({ ok: true, datum: iso(danas), ...rezultat });
}
