# Harta Petroșani

An interactive historical map of Petroșani, Romania, based on a 1910 survey map. Users can browse the map, drop annotated pins on locations of interest, attach descriptions and historical photos, and share the result as a living archive of the city's past.

Built as a fully static Cloudflare Pages app backed by a Cloudflare D1 (SQLite) database.

---

## Features

- **Pan & zoom** — smooth mouse/wheel navigation over a high-resolution SVG map
- **Pin placement** — press `p` to enter placement mode, then click anywhere on the map to drop a pin
- **Pin types** — 12 category icons (church, hospital, school, museum, train, etc.) cycled with arrow buttons while editing
- **Edit panel** — name, description, and (future) photo upload per pin; changes sync live to the map label
- **View panel** — click any pin to see its details; header color matches the pin category
- **Delete with confirmation** — two-click delete guard inside the edit panel
- **Camera animations** — smooth fly-in / fly-out when selecting or editing a pin
- **Persistent storage** — all pins stored in Cloudflare D1 and loaded on page open

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES modules), SVG |
| Map interaction | [svg-pan-zoom](https://github.com/bumbu/svg-pan-zoom) |
| Backend / API | Cloudflare Pages Functions (Workers) |
| Database | Cloudflare D1 (SQLite) |
| Fonts | Google Fonts — DM Serif Display, DM Sans |
| Local dev | Express + nodemon |

---

## Project structure

```
harta_petrosani/
├── public/                        # Static frontend (deployed to Cloudflare Pages)
│   ├── index.html
│   ├── style.css
│   ├── map.svg                    # 1910 historical map (~18 MB SVG)
│   ├── assets/
│   │   └── icons/                 # Pin-type icons (.ico)
│   └── src/
│       ├── main.js                # App entry point — init & event wiring
│       ├── appState.js            # Mode state machine + active/selected pin state
│       ├── constants.js           # Zoom levels, layout fractions, label config, event names
│       ├── map/
│       │   ├── pins.js            # Pin model, SVG rendering, type swaps
│       │   ├── camera.js          # Pan/zoom setup, fly-in/out animations
│       │   ├── svgCoords.js       # Screen ↔ SVG coordinate conversion
│       │   ├── icons.js           # Icon registry (type → path + color)
│       │   ├── pinPlacement.js    # 'p' key handler, click-to-drop, coord readout
│       │   ├── pinArrows.js       # Up/down arrow buttons for type cycling
│       │   └── api/
│       │       └── client.js      # Fetch wrappers for the REST API
│       ├── panels/                # UI side panels
│       │   ├── editPin.js         # Edit panel logic (new pin & update existing)
│       │   ├── editPin.html
│       │   ├── editPin.css
│       │   ├── viewPin.js         # View panel logic (read-only pin details)
│       │   ├── viewPin.html
│       │   └── viewPin.css
│       └── ui/
│           └── dashedBorder.js    # Shared SVG dashed-border helper
├── functions/api/                 # Cloudflare Pages Functions (serverless API)
│   ├── pins.js                    # GET /api/pins, POST /api/pins
│   ├── pins/[id].js               # PATCH /api/pins/:id, DELETE /api/pins/:id
│   └── images.js                  # (stub — future image upload endpoint)
├── db/
│   ├── schema.sql
│   └── seed.sql
├── server.js                      # Local Express dev server (alternative to wrangler)
├── wrangler.toml
└── package.json
```

---

## App modes

The app runs a simple state machine with five modes, stored in `appState.js`:

| Mode | Description |
|---|---|
| `BROWSE` | Default — pan and zoom freely |
| `PLACING` | Press `p` — crosshair cursor, click to drop a pin |
| `FLYING` | Camera animating — all input locked |
| `SELECTION` | Pin selected — view panel visible, pan/zoom still allowed |
| `EDITING` | Edit panel open — map dimmed, type arrows visible |

---

## Local development

### Option A — Wrangler (recommended, includes D1)

```bash
npm install
npx wrangler pages dev ./public
```

Runs at `http://localhost:8788` with the real D1 database via the Wrangler proxy.

### Option B — Express (no database)

```bash
npm run dev
```

Runs at `http://localhost:3000`. API calls will fail without a running D1 backend, but useful for frontend-only work.

---

## Database setup

**Create the table (run once):**

```bash
# Local
npx wrangler d1 execute petrosani --local --file=./db/schema.sql

# Remote (production)
npx wrangler d1 execute petrosani --remote --file=./db/schema.sql
```

**Seed initial data:**

```bash
# Local
npm run seed:local

# Remote
npm run seed:remote
```

---

## Deployment

```bash
npm run deploy
```

This runs `wrangler pages deploy ./public`, pushing the static frontend to Cloudflare Pages. The Functions in `functions/api/` are deployed automatically alongside it.

---

## Pin types

| Type | Color |
|---|---|
| camera | purple |
| church | grey |
| civic | grey |
| hospital | red |
| museum | purple |
| pharmacy | red |
| restaurant | orange |
| school | grey |
| shop | blue |
| stadium | green |
| train | dark slate |
| tree | green |
| *(generic)* | grey dot |

---

## Key constants (`src/constants.js`)

| Constant | Value | Purpose |
|---|---|---|
| `MAX_ZOOM` | 3× | Maximum zoom during normal browsing |
| `PLACEMENT_ZOOM_LEVEL` | 10× | Zoom level after a pin fly-in |
| `LABEL_ZOOM_THRESHOLD` | 1.5× | Zoom level at which pin labels appear |
| `PIN_FOCUS_X` | 5/16 | Horizontal screen position pin lands on (leaves room for panel) |
