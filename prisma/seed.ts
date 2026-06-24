import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo lozinke (promeni u produkciji): admin -> admin123, ostali -> 123456
const tim = [
  { ime: "Marko Mijatov", pozicija: "Dizajner", email: "marko.mijatov@firma.rs", uloga: "dizajner", lozinka: "123456", brojDanaGodisnjeg: 20 },
  { ime: "Milan Kujundžić", pozicija: "Dizajner", email: "milan.kujundzic@firma.rs", uloga: "dizajner", lozinka: "123456", brojDanaGodisnjeg: 20 },
  { ime: "Boris Šimunek", pozicija: "Dizajner", email: "boris.simunek@firma.rs", uloga: "dizajner", lozinka: "123456", brojDanaGodisnjeg: 20 },
  { ime: "Vladan Katjez", pozicija: "Dizajner", email: "vladan.katjez@firma.rs", uloga: "dizajner", lozinka: "123456", brojDanaGodisnjeg: 20 },
  { ime: "Nenad Miličev", pozicija: "Frontend developer", email: "nenad.milicev@firma.rs", uloga: "frontend", lozinka: "123456", brojDanaGodisnjeg: 20 },
  { ime: "Ognen Đurasinović", pozicija: "SEO specijalista", email: "ognen.djurasinovic@firma.rs", uloga: "seo", lozinka: "123456", brojDanaGodisnjeg: 20 },
  { ime: "Sava Marinković", pozicija: "Šef", email: "sava.marinkovic@firma.rs", uloga: "sef", lozinka: "admin123", brojDanaGodisnjeg: 25 },
];

async function main() {
  for (const z of tim) {
    const { lozinka, ...ostalo } = z;
    await prisma.zaposleni.upsert({
      where: { email: z.email },
      update: { ime: ostalo.ime, pozicija: ostalo.pozicija, uloga: ostalo.uloga },
      create: { ...ostalo, lozinkaHash: await bcrypt.hash(lozinka, 10) },
    });
  }
  console.log(`Seed gotov: ${tim.length} zaposlenih.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
