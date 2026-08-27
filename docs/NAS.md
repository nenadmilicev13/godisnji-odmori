# Postavljanje aplikacije na NAS server

Aplikacija se pakuje u dva Docker kontejnera:

- **odmori-app** — Next.js aplikacija (port 3000)
- **odmori-db** — PostgreSQL 16 baza (podaci u `./data/postgres`)

## 0. Preduslov: Docker na NAS-u

| NAS | Šta instalirati |
|-----|-----------------|
| Synology (DSM 7) | Package Center → **Container Manager** |
| Synology (DSM 6) | Package Center → **Docker** |
| QNAP | App Center → **Container Station** |
| Asustor / TerraMaster | App Central → **Docker Engine** / **Docker Manager** |
| TrueNAS SCALE | Apps → Custom App (ili `docker compose` preko SSH) |

Docker traži x86-64 (Intel/AMD) ili ARM64 NAS. Stariji ARMv7 modeli
(npr. Synology DS220j, DS120j) **ne podržavaju** Docker — za njih vidi
sekciju „Ako NAS nema Docker" na dnu.

Takođe uključi **SSH** pristup na NAS-u (DSM: Control Panel → Terminal & SNMP →
Enable SSH service).

## 1. Prebaci kod na NAS

Napravi share folder, npr. `/volume1/docker/odmori`.

**Varijanta A — preko Git-a (ako NAS ima git):**
```bash
ssh admin@NAS-IP
cd /volume1/docker
git clone <URL-repozitorijuma> odmori
cd odmori
```

**Varijanta B — bez Git-a:** iskopiraj ceo projekat (bez `node_modules` i
`.next`) u `/volume1/docker/odmori` preko File Station-a ili SMB share-a.

## 2. Napravi `.env`

U folderu `/volume1/docker/odmori` napravi fajl `.env` po uzoru na
`.env.docker.example`:

```bash
cp .env.docker.example .env
nano .env
```

Popuni:
- `POSTGRES_PASSWORD` — bilo koja duga lozinka
- `AUTH_SECRET` — nasumičan string; generiši sa
  `openssl rand -hex 32`

`RESEND_API_KEY` možeš ostaviti prazno — tada su email obaveštenja isključena,
a zvonce u aplikaciji radi normalno.

## 3. Pokreni

```bash
cd /volume1/docker/odmori
sudo docker compose up -d --build
```

Prvi build traje 3–10 minuta (zavisi od snage NAS-a). Prati log:

```bash
sudo docker compose logs -f app
```

Kad vidiš `Ready on http://localhost:3000`, aplikacija je gore:
**http://NAS-IP:3000**

> Na Synology DSM 6 komanda je `docker-compose` (sa crticom) umesto
> `docker compose`.

## 4. Ubaci početne korisnike (jednom)

```bash
sudo docker compose exec app npx tsx prisma/seed.ts
```

Ovo kreira tim iz `prisma/seed.ts` (šef: `sava.marinkovic@baseline.rs` /
`admin123`, ostali `123456`). **Odmah promeni lozinke** kroz aplikaciju.

## 5. Pristup iz firme i sa telefona

Unutar firme svi otvaraju `http://NAS-IP:3000`.

Za lepši pristup preko imena i HTTPS-a (potrebno da PWA/„Add to Home Screen"
radi kako treba):

**Synology Reverse Proxy** (Control Panel → Login Portal → Advanced →
Reverse Proxy → Create):
- Source: `HTTPS`, hostname `odmori.firma.local`, port `443`
- Destination: `HTTP`, `localhost`, port `3000`
- U tabu *Custom Header* klikni **Create → WebSocket**

Zatim u DNS-u firme (ili u ruteru) usmeri `odmori.firma.local` na IP NAS-a.

Ako treba pristup i van kancelarije, najbezbednije je VPN na NAS-u
(Synology: VPN Server paket) umesto otvaranja porta ka internetu.

## 6. Ažuriranje aplikacije

```bash
cd /volume1/docker/odmori
git pull                      # ili prekopiraj nove fajlove
sudo docker compose up -d --build
```

Baza ostaje netaknuta — živi u `./data/postgres`.

## 7. Backup baze

Ručno:
```bash
sudo docker compose exec db pg_dump -U odmori odmori > backup-$(date +%F).sql
```

Vraćanje:
```bash
cat backup-2026-01-15.sql | sudo docker compose exec -T db psql -U odmori odmori
```

Preporuka: dodaj `/volume1/docker/odmori/data` u Hyper Backup (Synology) ili
HBS (QNAP) zadatak, i zakaži gornji `pg_dump` kao Scheduled Task jednom dnevno.

## Rešavanje problema

| Problem | Rešenje |
|---------|---------|
| `port is already allocated` | Neko već koristi 3000 — u `docker-compose.yml` promeni u `"3080:3000"` |
| App restartuje u krug | `docker compose logs app` — najčešće nedostaje `AUTH_SECRET` u `.env` |
| `Can't reach database server` | Sačekaj — baza se diže prva; ako traje, `docker compose restart app` |
| Build pukne na `npm ci` | NAS nema pristup internetu ili malo RAM-a; vidi sekciju ispod |
| Sporo na slabom NAS-u | Build-uj image na svom računaru pa ga prebaci (ispod) |

### Build na računaru umesto na NAS-u

Ako NAS ima malo RAM-a (< 2 GB), build-uj lokalno i prebaci gotov image:

```bash
# na svom računaru, u folderu projekta
docker build -t odmori-app:latest .
docker save odmori-app:latest | gzip > odmori-app.tar.gz
# prebaci odmori-app.tar.gz na NAS, pa tamo:
sudo docker load < odmori-app.tar.gz
```

Zatim u `docker-compose.yml` zameni `build: .` sa `image: odmori-app:latest`.

> Ako je tvoj računar Apple Silicon (M1–M4), a NAS Intel/AMD, dodaj
> `--platform linux/amd64` u `docker build`.

## Ako NAS nema Docker

Instaliraj Node.js 20 i PostgreSQL direktno na NAS (Synology: Package Center →
Node.js v20 + PostgreSQL), pa:

```bash
npm ci
npm run build
npx prisma db push
npx tsx prisma/seed.ts
npm run start
```

Da radi i posle restarta NAS-a, napravi Triggered Task (Control Panel →
Task Scheduler → Triggered Task → Boot-up) koji pokreće `npm run start`
u folderu aplikacije.
