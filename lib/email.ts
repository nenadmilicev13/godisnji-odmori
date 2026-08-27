import { TipOdsustva, TIP_LABELE } from "./types";
import { formatDatum } from "./utils";

// Slanje mejlova preko Resend API-ja. Best-effort: ako RESEND_API_KEY nije
// postavljen ili dođe do greške, aplikacija nastavlja normalno (bez mejla).

const FROM = process.env.EMAIL_FROM || "Godišnji odmori <onboarding@resend.dev>";

/** Šalje jedan mejl na jednu adresu. Greške se loguju, ne bacaju. */
async function posalji(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // mejlovi isključeni dok ključ nije postavljen
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error(`Resend greška (${to}):`, res.status, await res.text());
    }
  } catch (e) {
    console.error(`Email izuzetak (${to}):`, e);
  }
}

/**
 * Šalje isti mejl svakom primaocu ZASEBNO. Tako jedan odbijen primalac ne
 * obara slanje ostalima (npr. dok domen nije verifikovan u Resend-u), a
 * adrese primalaca se ne vide jedna drugoj.
 */
async function posaljiSvakom(
  primaoci: string[],
  subject: string,
  html: string,
): Promise<void> {
  await Promise.all(primaoci.map((to) => posalji(to, subject, html)));
}

/** Obaveštava admina/šefa da je stigao nov zahtev. */
export async function mejlNovZahtev(opts: {
  adminEmails: string[];
  imePodnosioca: string;
  tip: TipOdsustva;
  datumOd: string;
  datumDo: string;
}): Promise<void> {
  if (!opts.adminEmails.length) return;
  await posaljiSvakom(
    opts.adminEmails,
    `Nov zahtev za odsustvo — ${opts.imePodnosioca}`,
    `<p><b>${opts.imePodnosioca}</b> je podneo zahtev za <b>${TIP_LABELE[opts.tip]}</b>.</p>
     <p>Period: <b>${formatDatum(opts.datumOd)} – ${formatDatum(opts.datumDo)}</b>.</p>
     <p>Prijavite se u aplikaciju da odobrite ili odbijete zahtev.</p>`,
  );
}

/** Obaveštava zaposlenog da je njegov zahtev odobren/odbijen. */
export async function mejlStatus(opts: {
  email: string;
  ime: string;
  odobreno: boolean;
  datumOd: string;
  datumDo: string;
}): Promise<void> {
  if (!opts.email) return;
  const rec = opts.odobreno ? "odobren ✅" : "odbijen";
  await posalji(
    opts.email,
    `Vaš zahtev za odsustvo je ${rec}`,
    `<p>Zdravo ${opts.ime},</p>
     <p>Vaš zahtev za odsustvo (<b>${formatDatum(opts.datumOd)} – ${formatDatum(opts.datumDo)}</b>) je <b>${rec}</b>.</p>`,
  );
}
