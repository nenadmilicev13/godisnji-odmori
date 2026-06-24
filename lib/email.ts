import { TipOdsustva, TIP_LABELE } from "./types";
import { formatDatum } from "./utils";

// Slanje mejlova preko Resend API-ja. Best-effort: ako RESEND_API_KEY nije
// postavljen ili dođe do greške, aplikacija nastavlja normalno (bez mejla).

const FROM = process.env.EMAIL_FROM || "Godišnji odmori <onboarding@resend.dev>";

async function posalji(
  to: string | string[],
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
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error("Resend greška:", res.status, await res.text());
  } catch (e) {
    console.error("Email izuzetak:", e);
  }
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
  await posalji(
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
