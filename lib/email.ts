import { TipOdsustva, TIP_LABELE } from "./types";
import { brojRadnihDana, formatDatum } from "./utils";

// Slanje mejlova preko Resend API-ja. Best-effort: ako RESEND_API_KEY nije
// postavljen ili dođe do greške, aplikacija nastavlja normalno (bez mejla).

const FROM = process.env.EMAIL_FROM || "Godišnji odmori <onboarding@resend.dev>";

/** Adresa aplikacije za dugme u mejlu. */
const APP_URL =
  process.env.APP_URL || "https://godisnji-odmori-mauve.vercel.app";

const BRAND = "#4f46e5";
const FONT =
  "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

/** Šalje jedan mejl na jednu adresu. Greške se loguju, ne bacaju. */
async function posalji(
  to: string,
  subject: string,
  html: string,
  text: string,
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
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
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
  primaoci: { email: string; html: string; text: string }[],
  subject: string,
): Promise<void> {
  await Promise.all(
    primaoci.map((p) => posalji(p.email, subject, p.html, p.text)),
  );
}

/** Sprečava da ime ili napomena razbiju HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Red = { oznaka: string; vrednost: string };

/** Tabela „oznaka → vrednost" unutar mejla. */
function detalji(redovi: Red[]): string {
  const celije = redovi
    .map((r, i) => {
      const linija = i ? "border-top:1px solid #e2e8f0;" : "";
      return `<tr>
      <td style="padding:12px 16px;${linija}font:400 13px/1.4 ${FONT};color:#64748b;width:40%;">${esc(r.oznaka)}</td>
      <td style="padding:12px 16px;${linija}font:600 14px/1.4 ${FONT};color:#0f172a;text-align:right;">${esc(r.vrednost)}</td>
    </tr>`;
    })
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">${celije}</table>`;
}

/** Dugme koje radi i u Outlook-u (bez CSS-a koji se ignoriše). */
function dugme(tekst: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;">
    <tr>
      <td style="border-radius:8px;background:${BRAND};">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 24px;border-radius:8px;font:600 14px/1 ${FONT};color:#ffffff;text-decoration:none;">${esc(tekst)}</a>
      </td>
    </tr>
  </table>`;
}

/** Zajednički okvir mejla — zaglavlje, sadržaj, podnožje. */
function omotac(opts: {
  naslov: string;
  pretekst: string;
  telo: string;
  akcenat?: string;
}): string {
  const akcenat = opts.akcenat ?? BRAND;
  return `<!doctype html>
<html lang="sr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.naslov)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.pretekst)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:${akcenat};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 4px;font:600 12px/1.2 ${FONT};letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Baseline &middot; Godišnji odmori</p>
              <h1 style="margin:0;font:700 21px/1.3 ${FONT};color:#0f172a;">${esc(opts.naslov)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 28px;">${opts.telo}</td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font:400 12px/1.5 ${FONT};color:#94a3b8;">Automatska poruka iz aplikacije za godišnje odmore. Na ovaj mejl nije potrebno odgovarati.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Stil pasusa u telu mejla. */
const P = `style="margin:0 0 12px;font:400 15px/1.6 ${FONT};color:#334155;"`;

/** Period u čitljivom obliku (jedan dan se ne ponavlja dvaput). */
function period(datumOd: string, datumDo: string): string {
  return datumOd === datumDo
    ? formatDatum(datumOd)
    : `${formatDatum(datumOd)} – ${formatDatum(datumDo)}`;
}

/** Obaveštava admina/šefa da je stigao nov zahtev. */
export async function mejlNovZahtev(opts: {
  /** Svaki admin dobija svoj link za odlučivanje (token je vezan za njega). */
  admini: { email: string; odlukaUrl?: string }[];
  imePodnosioca: string;
  tip: TipOdsustva;
  datumOd: string;
  datumDo: string;
  napomena?: string;
}): Promise<void> {
  if (!opts.admini.length) return;

  const dana = brojRadnihDana(opts.datumOd, opts.datumDo);
  const kada = period(opts.datumOd, opts.datumDo);

  const redovi: Red[] = [
    { oznaka: "Zaposleni", vrednost: opts.imePodnosioca },
    { oznaka: "Tip odsustva", vrednost: TIP_LABELE[opts.tip] },
    { oznaka: "Period", vrednost: kada },
    { oznaka: "Radnih dana", vrednost: String(dana) },
  ];
  if (opts.napomena && opts.napomena.trim()) {
    redovi.push({ oznaka: "Napomena", vrednost: opts.napomena.trim() });
  }

  const uvodHtml = `<p ${P}><b style="color:#0f172a;">${esc(opts.imePodnosioca)}</b> je podneo nov zahtev za odsustvo i čeka tvoje odobrenje.</p>
    ${detalji(redovi)}`;

  const text = [
    `${opts.imePodnosioca} je podneo nov zahtev za odsustvo.`,
    ``,
    `Tip: ${TIP_LABELE[opts.tip]}`,
    `Period: ${kada}`,
    `Radnih dana: ${dana}`,
    opts.napomena && opts.napomena.trim()
      ? `Napomena: ${opts.napomena.trim()}`
      : "",
    ``,
    `Odobri ili odbij ovde: ${APP_URL}`,
  ]
    .filter((r, i) => r !== "" || i > 0)
    .join("\n");

  const primaoci = opts.admini.map((a) => {
    const telo = a.odlukaUrl
      ? `${uvodHtml}${dugme("Odobri ili odbij", a.odlukaUrl)}`
      : `${uvodHtml}${dugme("Otvori zahtev", APP_URL)}`;
    const tekst = a.odlukaUrl
      ? text.replace(`Odobri ili odbij ovde: ${APP_URL}`, `Odobri ili odbij ovde: ${a.odlukaUrl}`)
      : text;
    return {
      email: a.email,
      html: omotac({
        naslov: "Nov zahtev za odsustvo",
        pretekst: `${opts.imePodnosioca} — ${TIP_LABELE[opts.tip]}, ${kada}`,
        telo,
      }),
      text: tekst,
    };
  });

  await posaljiSvakom(
    primaoci,
    `Nov zahtev za odsustvo — ${opts.imePodnosioca}`,
  );
}

/** Obaveštava zaposlenog da je njegov zahtev odobren/odbijen. */
export async function mejlStatus(opts: {
  email: string;
  ime: string;
  odobreno: boolean;
  datumOd: string;
  datumDo: string;
  tip?: TipOdsustva;
}): Promise<void> {
  if (!opts.email) return;

  const dana = brojRadnihDana(opts.datumOd, opts.datumDo);
  const kada = period(opts.datumOd, opts.datumDo);
  const akcenat = opts.odobreno ? "#10b981" : "#f43f5e";
  const rec = opts.odobreno ? "odobren" : "odbijen";

  const redovi: Red[] = [
    { oznaka: "Status", vrednost: opts.odobreno ? "Odobreno" : "Odbijeno" },
    ...(opts.tip
      ? [{ oznaka: "Tip odsustva", vrednost: TIP_LABELE[opts.tip] }]
      : []),
    { oznaka: "Period", vrednost: kada },
    { oznaka: "Radnih dana", vrednost: String(dana) },
  ];

  const uvod = opts.odobreno
    ? `Zdravo ${esc(opts.ime)}, tvoj zahtev za odsustvo je <b style="color:#059669;">odobren</b>. Prijatan odmor!`
    : `Zdravo ${esc(opts.ime)}, tvoj zahtev za odsustvo je <b style="color:#e11d48;">odbijen</b>. Za detalje se obrati šefu.`;

  const telo = `<p ${P}>${uvod}</p>
    ${detalji(redovi)}
    ${dugme("Pogledaj u aplikaciji", APP_URL)}`;

  const text = [
    `Zdravo ${opts.ime},`,
    ``,
    `Tvoj zahtev za odsustvo je ${rec}.`,
    `Period: ${kada}`,
    `Radnih dana: ${dana}`,
    ``,
    `Detalji: ${APP_URL}`,
  ].join("\n");

  await posalji(
    opts.email,
    `Zahtev za odsustvo je ${rec}`,
    omotac({
      naslov: opts.odobreno ? "Zahtev je odobren" : "Zahtev je odbijen",
      pretekst: `${kada} · ${dana} radnih dana`,
      telo,
      akcenat,
    }),
    text,
  );
}

/** Jedan red u nedeljnom pregledu. */
export type StavkaPregleda = {
  ime: string;
  tip: TipOdsustva;
  datumOd: string;
  datumDo: string;
};

/** Ponedeljkom: ko je sve odsutan ove nedelje — ide celom timu. */
export async function mejlNedeljniPregled(opts: {
  primaoci: string[];
  odDatum: string;
  doDatum: string;
  stavke: StavkaPregleda[];
}): Promise<void> {
  if (!opts.primaoci.length || !opts.stavke.length) return;

  const opseg = `${formatDatum(opts.odDatum)} – ${formatDatum(opts.doDatum)}`;
  const redovi: Red[] = opts.stavke.map((s) => ({
    oznaka: s.ime,
    vrednost: `${TIP_LABELE[s.tip]} · ${period(s.datumOd, s.datumDo)}`,
  }));

  const telo = `<p ${P}>Pregled odsustava za nedelju <b style="color:#0f172a;">${esc(opseg)}</b>.</p>
    ${detalji(redovi)}
    ${dugme("Otvori kalendar", APP_URL)}`;

  const text = [
    `Odsustva za nedelju ${opseg}:`,
    ``,
    ...opts.stavke.map(
      (s) => `- ${s.ime}: ${TIP_LABELE[s.tip]}, ${period(s.datumOd, s.datumDo)}`,
    ),
    ``,
    `Kalendar: ${APP_URL}`,
  ].join("\n");

  const html = omotac({
    naslov: "Ko je odsutan ove nedelje",
    pretekst: `${opts.stavke.length} odsustava · ${opseg}`,
    telo,
  });

  await posaljiSvakom(
    opts.primaoci.map((email) => ({ email, html, text })),
    `Odsustva ove nedelje — ${opseg}`,
  );
}

/** Podsetnik šefu da zahtevi predugo stoje na čekanju. */
export async function mejlPodsetnikNaCekanju(opts: {
  admini: { email: string; odlukaUrl?: string }[];
  stavke: StavkaPregleda[];
}): Promise<void> {
  if (!opts.admini.length || !opts.stavke.length) return;

  const koliko = opts.stavke.length;
  const redovi: Red[] = opts.stavke.map((s) => ({
    oznaka: s.ime,
    vrednost: `${TIP_LABELE[s.tip]} · ${period(s.datumOd, s.datumDo)}`,
  }));

  const uvodHtml = `<p ${P}>${
    koliko === 1
      ? "Jedan zahtev čeka tvoju odluku već nekoliko dana."
      : `${koliko} zahteva čekaju tvoju odluku već nekoliko dana.`
  }</p>
    ${detalji(redovi)}`;

  const text = [
    koliko === 1
      ? "Jedan zahtev čeka tvoju odluku:"
      : `${koliko} zahteva čekaju tvoju odluku:`,
    ``,
    ...opts.stavke.map(
      (s) => `- ${s.ime}: ${TIP_LABELE[s.tip]}, ${period(s.datumOd, s.datumDo)}`,
    ),
    ``,
    `Odluči ovde: ${APP_URL}`,
  ].join("\n");

  await posaljiSvakom(
    opts.admini.map((a) => ({
      email: a.email,
      html: omotac({
        naslov: koliko === 1 ? "Zahtev čeka odluku" : "Zahtevi čekaju odluku",
        pretekst: `${koliko} na čekanju`,
        telo: `${uvodHtml}${dugme(
          koliko === 1 ? "Odobri ili odbij" : "Otvori zahteve",
          a.odlukaUrl ?? APP_URL,
        )}`,
      }),
      text: a.odlukaUrl ? text.replace(APP_URL, a.odlukaUrl) : text,
    })),
    koliko === 1
      ? "Podsetnik: zahtev čeka odluku"
      : `Podsetnik: ${koliko} zahteva čekaju odluku`,
  );
}
