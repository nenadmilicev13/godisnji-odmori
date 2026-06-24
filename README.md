# Godišnji odmori 🌴

Aplikacija za unos i upravljanje godišnjim odmorima i odsustvima zaposlenih. **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, **Postgres + Prisma**, login sa ulogama.

## Funkcionalnosti

- 🔐 **Login** (server-side, hešovane lozinke, JWT cookie sesija)
- 👑 **Admin (šef)** je jedini koji može da **odobrava/odbija** zahteve i upravlja zaposlenima
- 📝 **Zahtevi za odsustvo** — godišnji, bolovanje, slobodan dan, plaćeno/neplaćeno (zaposleni unose samo za sebe)
- 🚫 **Pravilo: dva dizajnera ne mogu biti odsutna istovremeno** — proverava se na serveru pri kreiranju i pri odobravanju
- 🗓️ **Kalendar** — mesečni prikaz odsustava, sa upozorenjem kad se dizajneri preklope
- 👥 **Upravljanje zaposlenima** + pregled iskorišćenog godišnjeg
- 🗄️ **Zajednička Postgres baza** — ceo tim vidi iste podatke

## Podešavanje baze i pokretanje

```bash
# 1. Instaliraj zavisnosti
npm install

# 2. Napravi .env (kopiraj iz .env.example) i upiši DATABASE_URL + AUTH_SECRET
cp .env.example .env

# 3. Kreiraj tabele u bazi
npm run db:migrate        # prva migracija (npr. naziv: init)

# 4. Ubaci početni tim (seed)
npm run db:seed

# 5. Pokreni dev server
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

### Gde nabaviti bazu (besplatno)

- **Vercel Postgres**: Vercel dashboard → projekat → **Storage → Create Database → Postgres**. Vercel sam ubaci `DATABASE_URL` u env.
- **Neon** ([neon.tech](https://neon.tech)) ili **Supabase** — napravi projekat, kopiraj connection string u `DATABASE_URL`.

## Demo nalozi (posle seed-a)

| Uloga | Email | Lozinka |
|------|-------|---------|
| **Admin (šef)** | `sava.marinkovic@firma.rs` | `admin123` |
| Dizajner | `marko.mijatov@firma.rs` | `123456` |
| Dizajner | `milan.kujundzic@firma.rs` | `123456` |
| Dizajner | `boris.simunek@firma.rs` | `123456` |
| Dizajner | `vladan.katjez@firma.rs` | `123456` |
| Frontend | `nenad.milicev@firma.rs` | `123456` |
| SEO | `ognen.djurasinovic@firma.rs` | `123456` |

> ⚠️ Promeni demo lozinke i `AUTH_SECRET` pre produkcije.

## Deploy na Vercel

1. U Vercel projektu dodaj env varijable `DATABASE_URL` i `AUTH_SECRET` (Settings → Environment Variables).
2. Posle prvog deploya, jednom pokreni migracije i seed nad produkcijskom bazom:
   ```bash
   npm run db:deploy   # primeni migracije
   npm run db:seed     # ubaci tim
   ```
   (lokalno, sa produkcijskim `DATABASE_URL`-om u `.env`, ili preko Vercel CLI-ja).
3. Svaki `git push` na `main` radi novi deploy.

## Struktura

```
app/
  api/                  # API rute (login, logout, me, zaposleni, zahtevi)
  layout.tsx, page.tsx  # layout + glavna stranica (login gate, tabovi)
components/             # UI: LoginPage, Kalendar, forme i liste
lib/
  db.ts                 # Prisma klijent
  session.ts            # JWT cookie sesija
  auth-server.ts        # trenutni korisnik + serializacija
  store.tsx             # React Context (fetch ka API-ju + auth stanje)
  types.ts, utils.ts    # tipovi, obračun dana, pravilo preklapanja dizajnera
prisma/
  schema.prisma         # šema baze
  seed.ts               # početni tim
```

## Napomena o sigurnosti

Login štiti pristup i razdvaja uloge (admin vs zaposleni), a sva pravila se proveravaju **na serveru**. Lozinke su hešovane (bcrypt), sesija je potpisan HttpOnly cookie.
