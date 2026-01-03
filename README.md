# MoveKind — Umbraco 17 (API) + Next.js 14 (Web)

Accessible workout web app with an **Umbraco headless backend** and a **modern Next.js frontend**. Runs locally or in Docker with HTTPS inside the container for auth flows.

---
# ✅ Checklista – Betygskriterier

## Godkänt (G)

### Planering & Research
- [*] Genomfört en **noggrann målgruppsanalys**
- [*] Använt ett **projekthanteringsverktyg** (t.ex. Trello, Linear, Jira, GitHub Projects) med backlog och struktur

### Design & Prototyping
- [*] Skapat **wireframes i Figma**
- [*] Skapat en **prototyp i Figma** som följer UX/UI-principer
- [*] Designen är **responsiv för minst två skärmstorlekar**
- [*] Designen följer **WCAG 2.1**

### Applikationsutveckling
- [*] Utvecklat med ett **modernt JavaScript-ramverk** (t.ex. React, Vue, Next.js)
- [*] Använder **databas** för lagring och hämtning av data
- [*] Implementerat **state-hantering**
- [*] Skapat **dynamiska och interaktiva komponenter**
- [*] Följer **WCAG 2.1** i implementationen
- [*] Använder **semantisk HTML**
- [*] **Webbapp:** Responsiv och fungerar korrekt på minst två skärmstorlekar (mobil + desktop)
- [ ] **Native mobilapp (om relevant):** Anpassad för olika skärmstorlekar och orienteringar
- [*] **README** innehåller:
  - [*] Hur projektet körs
  - [*] Publik länk
  - [*] Checklista med uppfyllda betygskriterier

### Versionshantering
- [*] Använder **Git**
- [*] Har ett **GitHub-repo**

### Slutrapport (2–3 sidor)
- [*] **Abstract på engelska**
- [*] Beskrivning av **tech stack + motivering**
- [*] Dokumentation av **arbetsprocess, planering och research**

### Deploy
- [*] Projektet är **hostat och publikt tillgängligt**

### Helhetsupplevelse
- [*] Inga tekniska fel (t.ex. döda länkar eller kraschande sidor)
- [*] **Konsekvent design**
- [*] **Obruten och tydlig navigation**

---

## Väl Godkänt (VG)

### Grundkrav
- [*] Alla kriterier för **Godkänt (G)** är uppfyllda

### Design & Prototyping (VG)
- [*] Prototypen innehåller **interaktivitet** som visar användarflöden
- [*] Prototypen är **väldigt lik den färdiga produkten**
- [*] Designen följer **WCAG 2.1 nivå A och AA utan undantag**

### Applikationsutveckling (VG)
- [ ] Använder **global state management** (t.ex. Redux eller Pinia)
- [*] Koden följer **WCAG 2.1 nivå A och AA utan undantag**
- [*] Testad i **WebAIM WAVE** utan errors eller warnings
- [*] Appen är **optimerad**:
  - [*] Återanvänder komponenter och kod
  - [*] Använder rimliga filformat och filstorlekar
  - [*] Implementerar prestandaoptimering där det behövs
- [*] Implementerat **CRUD** (Create, Read, Update, Delete)
- [*] Säker hantering av användardata vid CRUD-operationer
- [*] Implementerat **säker autentisering** (OAuth, JWT eller Firebase Auth)
- [*] **Webbapp:** Fullt responsiv från mobil till stora skärmar
- [*] README förklarar:
  - [*] Tekniska val (varför)
  - [*] Implementation av viktiga funktioner (hur)

### Versionshantering (VG)
- [ ] Arbetar med **feature branches**
- [ ] Använder **pull requests** innan merge till main
- [*] Har **tydliga och informativa commit-meddelanden**

### Deploy (VG)
- [*] Har **automatiserat bygge och deploy (CI/CD)**

### Slutrapport (3–6 sidor)
- [*] Djupgående analys av hela arbetsprocessen
- [*] Reflektion kring utmaningar, lösningar och lärdomar
- [*] Motivering av val av tekniker och verktyg
- [*] Förklaring av UX/UI- och tillgänglighetsbeslut

### Helhetsupplevelse (VG)
- [*] Professionell och optimerad användarupplevelse
- [*] Minimala laddningstider
- [*] Tydlig feedback vid alla användarinteraktioner
- [*] Testad på flera enheter och webbläsare



## Contents

- Architecture
- Repo structure
- Requirements
- Local development (without Docker)
- Local development (Docker)
- Environment variables
- API endpoints (frontend proxy)
- App pages
- Seeding database & media
- Certificates & HTTPS
- Image/media notes
- Deployment (server)
- Push images to Docker Hub
- Troublesbleshooting
- Accessibility checklist
- License
- Quick start (TL;DR)

---

## Architecture

**Backend (API)**  
Umbraco 17 (.NET 10) running on Kestrel. Exposes the Delivery API over:
- HTTP: `:8080`
- HTTPS: `:8443`
- Live: `https://movekindb.bovision.se/umbraco/`

**Frontend (Web)**  
Next.js 14 (App Router) with TypeScript. Talks to the API over the internal Docker network using the service name `api`.
- Live `https://movekind.bovision.se`

**DB / Media**  
SQLite for development with persistent volumes. Media files are mounted. Can switch to PostgreSQL or SQL Server in production.

**HTTPS**  
- Dev: self-signed PFX generated inside the API container
- Prod: terminate TLS at a reverse proxy (Traefik / Nginx) with real certificates

---

## Repo structure

```
.
├─ MoveKind.sln
├─ MoveKind.Umbraco/           # Umbraco 17 API (.NET 10)
│  ├─ Dockerfile
│  └─ ... source
├─ movekind.web/               # Next 14 + TypeScript frontend
│  ├─ Dockerfile
│  └─ ... source
├─ docker/
│  ├─ entrypoint.sh            # API container entrypoint (seed DB, create cert)
│  └─ seed/
│     ├─ Umbraco.sqlite.db     # Seeded SQLite (optional)
│     ├─ Umbraco.sqlite.db-shm # Seeded write-ahead state (optional)
│     ├─ Umbraco.sqlite.db-wal # Seeded write-ahead state (optional)
│     └─ media/                # Media seed
├─ docker-compose.yml
└─ README.md
```

---

## Requirements

- Node.js 20+ and npm (for non-Docker dev)
- .NET SDK 10 (for non-Docker dev)
- Docker Desktop / Docker Engine 24+

---

## Local development (without Docker)

### Frontend only

Copy `.env.example` → `.env.local` and adjust:

```
NEXT_PUBLIC_UMBRACO_URL=https://movekindb.bovision.se
NEXT_PUBLIC_UMBRACO_ORIGIN=https://movekindb.bovision.se
```

If the API uses a self-signed certificate, you can temporarily allow it:

```
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

Install & run:

```
cd movekind.web
npm install
npm run dev
```

Open: http://localhost:3000

---

### Backend only

Open **MoveKind.Umbraco** in your IDE and run it.

For local HTTPS dev with Kestrel, ensure a dev cert is available:

```
dotnet dev-certs https --trust
```

Or rely on the Docker entrypoint when using containers.

---

## Local development (Docker)

**Recommended** for consistent HTTPS and DB/media persistence.

(Optional) Place a seeded DB and media under `docker/seed/`.

If empty, Umbraco initializes a new SQLite DB on first run.

Start everything:

```
docker compose up --build
```

- API: https://localhost:8443  
- API (HTTP): http://localhost:8080
- Web: http://localhost:3000

A healthcheck ensures the web waits until the API is ready.

Stop:

```
docker compose down
```

---

## Environment variables

### Frontend (`movekind.web`)

| Variable | Purpose | Example |
|--------|--------|--------|
| `NEXT_PUBLIC_UMBRACO_URL` | Base URL the web calls | `https://api:8443` (Docker) |
| `NEXT_PUBLIC_UMBRACO_ORIGIN` | Build absolute media URLs | `https://api:8443` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Allow self-signed certs (dev only) | `0` |

In Docker, these are set in `docker-compose.yml`.

---

### Backend (`MoveKind.Umbraco`)

| Variable | Purpose | Example |
|-------|-------|-------|
| `ASPNETCORE_URLS` | Kestrel bind URLs | `http://+:8080;https://+:8443` |
| `ASPNETCORE_ENVIRONMENT` | Environment | `Production` |
| `ASPNETCORE_Kestrel__Endpoints__Http__Url` | HTTP endpoint | `http://+:8080` |
| `ASPNETCORE_Kestrel__Endpoints__Https__Url` | HTTPS endpoint | `https://+:8443` |
| `ASPNETCORE_Kestrel__Certificates__Default__Path` | PFX path | `/https/aspnetapp.pfx` |
| `ASPNETCORE_Kestrel__Certificates__Default__Password` | PFX password | `pass123!` |
| `ConnectionStrings__umbracoDbDSN` | DB connection string | SQLite path |
| `CERT_*` | Used by entrypoint to create dev cert | see `docker-compose.yml` |

---

## API endpoints (frontend proxy)

The Next.js app exposes friendly endpoints that proxy to Umbraco:

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
POST   /api/auth/change-password

GET    /api/members/me
PUT    /api/members/me

GET    /api/favorites
GET    /api/favorites/ids
POST   /api/favorites/:workoutId
DELETE /api/favorites/:workoutId
POST   /api/favorites/:workoutId/toggle
```

---

## App pages

- `/` – Home (search, quick links, recommended sessions)
- `/login` – Login
- `/register` – Register
- `/profile` – Profile (view/update, logout)
- `/favorites` – Your favorites
- `/workouts` – Workout list
- `/workouts/[slug]` – Workout detail
- `/workouts/[slug]/play` – Video player with steps, progress, captions toggle

Ensure the Umbraco Delivery API returns the properties expected by the frontend:
`imageUrl`, `title`, `duration`, `level`, `tags`, etc.

---

## Seeding database & media

Put SQLite files and media under `docker/seed/`.

Mounted as volumes:

- DB → `/app/umbraco/Data/Umbraco.sqlite.db`
- Media → `/app/wwwroot/media`

On first run, `entrypoint.sh` also creates a dev HTTPS cert if missing.

---

## Certificates & HTTPS

The API container auto-generates a self-signed PFX:

```
dotnet dev-certs https -ep /https/aspnetapp.pfx -p ${CERT_PASSWORD}
```

- HTTPS bound on `:8443`
- Frontend calls `https://api:8443` inside Docker

For local browser access to the API, you may need to accept the cert at:

```
https://localhost:8443
```

**Production:** terminate TLS at a reverse proxy and remove any `NODE_TLS_REJECT_UNAUTHORIZED=0` usage.

---

## Image / media notes

Next.js image optimization requires real image responses.

If optimization fails (`text/plain` MIME):

- Serve images directly from Umbraco and configure `images.remotePatterns`, or
- Use a plain `<img>` tag, or
- Fix the proxy to forward correct headers and bytes

Example CMS JSON:

```
"image": [
  {
    "url": "/media/3enf35vt/free-video-3195651.jpg",
    "properties": { "alttext": "free-video" }
  }
]
```

Type:

```
image?: Array<{ url: string; properties?: { alttext?: string } }>;
```

---

## Deployment (server)

1. Push images to a registry (see below)
2. Install Docker on the server
3. Create a `.env` with secrets
4. Update `docker-compose.yml` to use `image:` instead of `build:`

Start:

```
docker compose pull
docker compose up -d
```

(Prod) Put Traefik or Nginx in front for HTTPS.

Switch to PostgreSQL / SQL Server by replacing `ConnectionStrings__umbracoDbDSN`.

---

## Push images to Docker Hub

Example using Docker Hub user **melisarsh**:

```
docker login

docker tag movekind-api:latest melisarsh/movekind-api:latest
docker tag movekind-web:latest melisarsh/movekind-web:latest

docker push melisarsh/movekind-api:latest
docker push melisarsh/movekind-web:latest
```

Update `docker-compose.yml`:

```
services:
  api:
    image: melisarsh/movekind-api:latest

  web:
    image: melisarsh/movekind-web:latest
```

---

## Troubleshooting

**ECONNREFUSED from frontend**  
Use `https://api:8443` inside Docker, not `localhost`.

**“This server only accepts HTTPS requests.”**  
Ensure API exposes HTTPS and frontend uses `https://api:8443`.

**Next Image optimization fails**  
Proxy isn’t returning a real image. Use `<img>` or fix headers.

**SQLite unable to open database file**  
Check volume mounts and file permissions.

**Self-signed cert warnings**  
Dev only: set `NODE_TLS_REJECT_UNAUTHORIZED=0`.

---

## Accessibility checklist

- Semantic landmarks (`<main>`, headings)
- No adjacent duplicate links
- Correct `alt` usage
- WCAG color contrast
- Keyboard accessible controls
- Visible focus states
- Media captions / transcripts (WCAG 1.2.x)

---

## License

Private project for now. Add a license if/when open sourced.

---

## Quick start (TL;DR)

```
# run locally with Docker
docker compose up --build

# web
http://localhost:3000

# api
https://localhost:8443
```

```
# push images
docker login
docker tag movekind-api:latest melisarsh/movekind-api:latest
docker tag movekind-web:latest melisarsh/movekind-web:latest
docker push melisarsh/movekind-api:latest
docker push melisarsh/movekind-web:latest
```

