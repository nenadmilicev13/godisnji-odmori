// Srpski državni (neradni) praznici — fiksni + pomerljivi (pravoslavni Uskrs).

/** Pravoslavni Uskrs (Vaskrs) kao gregorijanski datum. Važi za 1900–2099. */
function pravoslavniUskrs(godina: number): Date {
  const a = godina % 4;
  const b = godina % 7;
  const c = godina % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const mesec = Math.floor((d + e + 114) / 31); // 3 = mart, 4 = april (julijanski)
  const dan = ((d + e + 114) % 31) + 1;
  const julijanski = new Date(godina, mesec - 1, dan);
  julijanski.setDate(julijanski.getDate() + 13); // julijanski -> gregorijanski (1900–2099)
  return julijanski;
}

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dan = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dan}`;
}

const kes = new Map<number, Map<string, string>>();

/** Mapa praznika za godinu: ISO datum -> naziv. */
export function prazniciMapa(godina: number): Map<string, string> {
  const postoji = kes.get(godina);
  if (postoji) return postoji;

  const m = new Map<string, string>();
  // Fiksni praznici
  m.set(`${godina}-01-01`, "Nova godina");
  m.set(`${godina}-01-02`, "Nova godina");
  m.set(`${godina}-01-07`, "Božić");
  m.set(`${godina}-02-15`, "Dan državnosti");
  m.set(`${godina}-02-16`, "Dan državnosti");
  m.set(`${godina}-05-01`, "Praznik rada");
  m.set(`${godina}-05-02`, "Praznik rada");
  m.set(`${godina}-11-11`, "Dan primirja");

  // Uskršnji praznici: Veliki petak – Vaskrsni ponedeljak
  const uskrs = pravoslavniUskrs(godina);
  const petak = new Date(uskrs);
  petak.setDate(uskrs.getDate() - 2);
  const subota = new Date(uskrs);
  subota.setDate(uskrs.getDate() - 1);
  const ponedeljak = new Date(uskrs);
  ponedeljak.setDate(uskrs.getDate() + 1);
  m.set(iso(petak), "Veliki petak");
  m.set(iso(subota), "Velika subota");
  m.set(iso(uskrs), "Vaskrs");
  m.set(iso(ponedeljak), "Vaskršnji ponedeljak");

  kes.set(godina, m);
  return m;
}

/** Da li je ISO datum (yyyy-mm-dd) državni praznik. */
export function jePraznik(isoDatum: string): boolean {
  const godina = Number(isoDatum.slice(0, 4));
  if (!godina) return false;
  return prazniciMapa(godina).has(isoDatum);
}

export function nazivPraznika(isoDatum: string): string | null {
  const godina = Number(isoDatum.slice(0, 4));
  if (!godina) return null;
  return prazniciMapa(godina).get(isoDatum) ?? null;
}
