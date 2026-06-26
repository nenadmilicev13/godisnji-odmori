# Email notifikacije (Resend) — setup za kasnije

Aplikacija **već šalje** mejlove na ove događaje (kod je gotov, samo „uspavan"):

- **Nov zahtev** → mejl svim šefovima (admin).
- **Odobren / odbijen zahtev** → mejl zaposlenom.

Sve radi čim postaviš `RESEND_API_KEY`. Dok ga nema, app radi normalno (samo in-app zvonce, bez greške i bez mejlova).

## Da li se plaća?

**Ne** za naš obim. Resend besplatni nivo: ~**3.000 mejlova/mesec, 100/dan, bez kreditne kartice**. Mi šaljemo par mejlova po zahtevu — daleko ispod limita.

## Koraci

### 1. Napravi nalog i API ključ
1. Registruj se na <https://resend.com>.
2. **API Keys → Create API Key** → kopiraj vrednost (počinje sa `re_...`).

### 2. (Za slanje celom timu) Verifikuj domen
Bez ovoga Resend šalje **samo na tvoj sopstveni mejl** (test režim).

1. **Domains → Add Domain** → unesi `baseline.rs`.
2. Resend ti da nekoliko **DNS zapisa** (SPF / DKIM, tipa TXT i CNAME).
3. Dodaj te zapise kod registra domena (gde je kupljen `baseline.rs`).
4. Sačekaj da Resend pokaže **Verified** (obično par minuta do par sati).

### 3. Postavi env varijable
U `.env` (lokalno) i na **Vercel → Settings → Environment Variables** (produkcija):

```
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="Godišnji odmori <odmori@baseline.rs>"
```

- `EMAIL_FROM` mora da koristi **verifikovan domen** (npr. `@baseline.rs`).
- Za brzu probu bez domena: `EMAIL_FROM="Godišnji odmori <onboarding@resend.dev>"` — ali tada stiže samo na tvoj Resend-nalog mejl.

### 4. Restartuj / redeploy
- Lokalno: ugasi i pokreni `npm run dev`.
- Vercel: posle dodavanja env varijabli uradi **Redeploy**.

### 5. Provera
- Napravi nov zahtev → šef treba da dobije mejl.
- Odobri/odbij → zaposleni treba da dobije mejl.
- Ako ne stiže: proveri da je domen **Verified** i da `EMAIL_FROM` koristi taj domen. Greške se loguju u serverskoj konzoli (`Resend greška: ...`), ne ruše app.

## Gde je kod
- `lib/email.ts` — slanje (Resend API, best-effort).
- `app/api/zahtevi/route.ts` — mejl šefovima pri novom zahtevu.
- `app/api/zahtevi/[id]/route.ts` — mejl zaposlenom pri odluci.
- In-app notifikacije (zvonce) rade nezavisno od mejla.
