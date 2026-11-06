# BinPulse Console — React + Vite

A smart-waste fleet operations console: 17 screens across 6 navigation groups,
with client-side simulated live sensor data (BIN-A1 represents the real ESP32 bin).

## Run it

```bash
npm install     # first time only
npm run dev     # start dev server → http://localhost:5173
npm run build   # production build into dist/
npm run preview # preview the production build
```

Requires Node.js 18+ (tested on Node 24).

## Project structure

```
src/
  main.jsx                 # React entry
  App.jsx                  # shell, hash routing, theme, screen registry
  index.css                # full design system (light + dark tokens)
  state/
    FleetContext.jsx       # live-data provider: 3s simulation loop, actions, toasts
  data/
    model.js               # fleet model, mock entities, derived stats, drift logic
  components/
    icons.jsx              # inline SVG icon set + <Icon>
    ui.jsx                 # Panel, PageHeader, Stat, Badge, Meter, Toggle, Avatar, AnimatedNumber
    charts.jsx             # Gauge, Spark, AreaChart, BarChart, Donut (pure SVG)
    Sidebar.jsx, Topbar.jsx, EventRow.jsx
  screens/                 # one file per screen (17 total)
    Dashboard, BinMonitoring, BinDetails, LiveMap,
    Alerts, Collection, Crew, Voice, Chat, Analytics,
    Devices, Diagnostics, Users, Roles, ApiIntegration,
    Notifications, Settings
```

## Shared data model

- **Bin:** id, name, sector, zone (Central/North/East/South/West), x/y map coords,
  fill %, distance, capacity L, battery %, rssi, temp, fillRate %/h, team,
  type (General/Recycling/Organic), online, sensorOk, lastUpdateS, isReal.
- **Status thresholds:** ≥80 Full · ≥50 Almost full · else Available.
- **Fleet:** 14 bins · 5 zones · 5 teams (Alpha–Echo); drifts every 3s; BIN-A1 is the live bin.
- **Mock entities:** CREW, USERS, ROLES/PERM_KEYS, API_KEYS, CHAT_SESSIONS, VOICE_INTENTS.

## Going live (replace the simulation)

The demo generates data client-side. To drive the UI from a real backend:

1. Open `src/state/FleetContext.jsx`. In the `setInterval` loop, replace the
   `driftFleet(prev)` call with a `fetch('/api/status')` that returns the bins.
2. Point the event stream at `/api/events` (or `/api/voice/stream` via `EventSource`).
3. In `src/data/model.js`, `answerQuery()` can POST to `/api/voice/query` instead of
   computing answers locally.
4. The danger-zone reset in `Settings` already maps to `POST /api/reset`.

`POLL_MS` in `FleetContext.jsx` controls the refresh interval.
