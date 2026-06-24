# Godišnji odmori 🌴

Aplikacija za unos i upravljanje godišnjim odmorima i odsustvima zaposlenih. Napravljena u **Next.js 14** (App Router), **TypeScript** i **Tailwind CSS**.

## Funkcionalnosti

- 📊 **Pregledna tabla** sa statistikom (broj zaposlenih, zahtevi na čekanju, odobreni zahtevi, iskorišćeni dani)
- 📝 **Unos zahteva za odsustvo** — godišnji, bolovanje, slobodan dan, plaćeno/neplaćeno odsustvo
- ✅ **Odobravanje / odbijanje** zahteva
- 👥 **Upravljanje zaposlenima** sa pregledom iskorišćenog godišnjeg odmora
- 🗓️ **Automatski obračun radnih dana** (bez vikenda)
- 💾 **Lokalno čuvanje podataka** (localStorage) — bez potrebe za bazom ili serverom
- 🔍 **Filtriranje** zahteva po statusu

## Pokretanje

```bash
# 1. Instaliraj zavisnosti
npm install

# 2. Pokreni development server
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000) u pregledaču.

## Produkcija

```bash
npm run build
npm run start
```

## Struktura projekta

```
godisnji-odmori/
├── app/
│   ├── globals.css        # Globalni stilovi + Tailwind + komponente klase
│   ├── layout.tsx         # Root layout, učitava StoreProvider
│   └── page.tsx           # Glavna stranica (dashboard, tabovi, statistika)
├── components/
│   ├── Badge.tsx          # Oznaka statusa (na čekanju / odobreno / odbijeno)
│   ├── Modal.tsx          # Modalni prozor (reusable)
│   ├── StatCard.tsx       # Kartica sa statistikom
│   ├── ZahtevForma.tsx    # Forma za unos novog zahteva
│   ├── ZahteviLista.tsx   # Lista zahteva sa filterima i akcijama
│   └── ZaposleniLista.tsx # Lista zaposlenih + dodavanje
├── lib/
│   ├── types.ts           # TypeScript tipovi i labele
│   ├── utils.ts           # Pomoćne funkcije (obračun dana, formatiranje)
│   ├── storage.ts         # Čitanje/pisanje u localStorage + demo podaci
│   └── store.tsx          # React Context — globalno stanje aplikacije
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```

## Tehnologije

- **Next.js 14** — App Router
- **React 18**
- **TypeScript**
- **Tailwind CSS 3**

Podaci se čuvaju u `localStorage` pregledača, pa nije potreban backend. Pri prvom pokretanju kreiraju se demo zaposleni koje možete obrisati.
