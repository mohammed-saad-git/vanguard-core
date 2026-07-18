# Vanguard-Core: GenAI Stadium Command and Control Orchestrator

Vanguard-Core is a FIFA World Cup 2026 stadium operations dashboard that turns
raw incident telemetry into actionable command decisions: severity triage,
crowd-density monitoring, adjacent-sector rerouting, multilingual public-address
broadcasts, and a persistent incident audit trail. It runs with live Gemini
generation when an API key is present and falls back to a deterministic offline
engine when one is not, so the product remains fully usable in air-gapped venues.

---

## Overview

Stadium operators face fast-moving, high-consequence decisions during ingress,
half-time, and egress phases. Vanguard-Core supplies a single command surface
that:

- Ingests structured telemetry (`stadium`, `match phase`, `crowd density`,
  `incident report`, `playing teams`).
- Triages the incident with a deterministic severity engine that guarantees
  medical / crush / fire / structural events escalate to Priority 1.
- Computes safe reroute targets by walking an explicit sector-adjacency graph
  and excluding both `High` and `Critical` overflow candidates.
- Produces tactical directives, staff deployment, crowd-flow instructions,
  and synchronized English / Spanish / localized-team-language PA scripts.
- Maintains a persistent audit trail so any past decision can be reviewed and
  restored to the live panel.

Live orchestration can be produced by Gemini (`gemini-3.5-flash` by default);
the offline simulation engine produces a schema-identical response so the UI is
unaffected when the upstream model is unavailable.

---

## Architecture

```text
┌──────────────────── Browser (React 19 + Vite SPA) ────────────────────┐
│  App.tsx              state owner: sectors, history, activeIncident    │
│   ├─ Header                       utc clock isolated for render perf   │
│   ├─ PresetScenarios              one-click telemetry hydration         │
│   ├─ TelemetryForm                validated operator input              │
│   ├─ StadiumMap                   SVG density grid + reroute overlay    │
│   ├─ ActionResultsPanel           severity / directives / broadcasts    │
│   │   └─ BroadcastSimulator (lazy) SpeechSynthesis PA playback         │
│   └─ IncidentAuditTrail           restore-past-decision logs            │
│                                                                        │
│  lib/  config  ·  sanitize  ·  validation  ·  severity  ·  sectors     │
│        simulation  ·  prompt  ·  aiResponse  ·  priority  ·  index     │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ POST /api/orchestrate
┌────────────────────────────────▼───────────────────────────────────────┐
│  Express server (server.ts)                                            │
│   · Security headers (CSP, COOP, COEP, HSTS, Referrer, Permissions)    │
│   · In-memory IP rate limiter (`15 req/min`)                           │
│   · JSON body cap (10kb) + syntax-error guard                          │
│   · validateOrchestrationPayload  ─▶  Gemini prompt builder             │
│        ↓ responseSchema-constrained Gemini call                        │
│   · validateIncidentResult (defensive schema recheck) ─▶ /api/health   │
└────────────────────────────────────────────────────────────────────────┘
```

The same `src/lib` package is consumed by the browser bundle, the server
bundle, and the test process — so cross-cutting logic (sanitisation,
validation, severity, sector routing) has exactly one implementation in the
repo.

---

## System Workflow

1. **Ingest** – An operator selects a Scenario Preset (Turnstile Failure,
   Medical Collapse, Pyro Incident, Power Lockout) or hand-writes telemetry in
   the Telemetry Ingestion Portal. Selecting a sector on the SVG map also
   backfills the active report.
2. **Validate** – Pre-flight sanitisation removes HTML tags, obfuscated
   `javascript:` URIs, and unsupported Unicode glyphs, then clamps each field
   to its configured maximum length.
3. **Orchestrate** – `POST /api/orchestrate` runs IP-based rate limiting and
   body validation, then routes to Gemini (online) or the deterministic
   `createSimulationResult` (offline). Both return the same JSON shape.
4. **Triage & Route** – The severity engine classifies the incident (Priority
   1–4). Sector routing walks the affected sector's adjacency list and selects
   the first non-`High`/`Critical` neighbours as overflow targets.
5. **Broadcast** – The PA simulator renders the chosen language script on the
   simulated giant screen and optionally plays SpeechSynthesis audio for
   operator rehearsal.
6. **Audit** – Each orchestration is appended to the immutable audit trail;
   any historical record can be restored to the live panel for review.

---

## Decision Engine

The decision engine is intentionally **deterministic** so it can be exercised
in tests and verified offline. Three layers compose the decision:

| Layer | Module | Responsibility |
| --- | --- | --- |
| `assessSeverity` | `src/lib/severity.ts` | Forces Priority 1 + Immediate + Stadium Wide when the report contains any critical incident term (`medical`, `crush`, `fire`, `smoke`, `structural`, `collapse`, `pyro`, `respiratory`, `breathing`, `compressed`, `trapped`). Falls back to density-driven Priority 2/3/4 otherwise. |
| `resolveAffectedSectorId` | `src/lib/sectors.ts` | Maps narrative keywords to the most specific affected sector id; ambiguous reports fall through to a deterministic default (`sec-102`). |
| `getRerouteSectorIds` | `src/lib/sectors.ts` | Filters the affected sector's adjacency list, excluding `High` and `Critical` neighbours so overflow never funnels into another congested zone. |

When Gemini is available the same decision protocol is encoded into the system
prompt as five explicit rules; the model is constrained by a JSON response
schema (`responseSchema`) and its output is re-validated by
`validateIncidentResult` before being returned to the client. This **defence
in depth** means a malformed, drifted, or prompt-injected model response can
never reach the UI surface.

---

## Performance Optimisations

| Optimisation | Location | Effect |
| --- | --- | --- |
| Pre-computed `ReadonlySet` validation | `src/lib/validation.ts` | Stadium / phase / density check is O(1) per field. |
| Memoised centroid / sector Maps | `src/components/StadiumMap.tsx` | SVG sibling re-renders skip work when `sectors` is unchanged. |
| `useCallback` for all event handlers | `src/App.tsx` | Child components wrapped in `React.memo` avoid re-renders on parent state changes they don't care about. |
| Isolated UTC clock | `src/components/Header.tsx` | The 1 Hz clock no longer cascades re-renders into the entire app tree. |
| Lazy-loaded `BroadcastSimulator` | `src/components/ActionResultsPanel.tsx` | SpeechSynthesis code only ships when an active incident exists. The build splits it into a 7 KB chunk. |
| Memoised derived `mapState` | `src/App.tsx` | Active sector + reroute list recomputed only when `activeIncident` or `sectors` change. |
| Rate limiter sweep | `server.ts` | Stale IP buckets are dropped periodically so the in-memory Map cannot grow unbounded. |
| Single source of truth for constants | `src/lib/config.ts` | Magic numbers (fill ratios, rate limits, text caps, blocked densities) are centralised and typed. |
| O(adjacencies) routing | `getRerouteSectorIds` | Sector routing is linear in adjacency count instead of array scans per query. |

The production build splits the broadcast chunk separately (see `npm run build`
output) and ships a gzipped ~76 KB primary bundle.

---

## Security Model

Vanguard-Core assumes **every telemetry value is adversarial** and defends at
five layers:

1. **Input sanitisation** (`src/lib/sanitize.ts`) – strips HTML tags, removes
   obfuscated `javascript:` URIs (even with interleaved whitespace), allows
   only a safe Unicode subset, and caps each field to a defined maximum length.
2. **Schema validation** (`src/lib/validation.ts`) – enforce strict types,
   whitelist stadiums, match phases, and crowd-density levels via
   `ReadonlySet`s, and return structured error responses.
3. **Prompt-injection boundary** (`src/lib/prompt.ts`) – telemetry is fenced
   inside a JSON block inside the system prompt with an explicit instruction
   that any control text inside it must be treated as data-only.
4. **Response re-validation** (`src/lib/aiResponse.ts`) – the Gemini JSON
   output is re-checked against the canonical shape *before* being trusted;
   malformed or out-of-range fields trigger a `500` instead of leaking to the
   UI.
5. **HTTP hardening** (`server.ts`) – `Content-Security-Policy` (with
   `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
   `upgrade-insecure-requests`, scoped `script-src`/`style-src`/`connect-src`
   per environment), `X-Content-Type-Options`, `X-Frame-Options: DENY`,
   `Referrer-Policy: no-referrer`, `Permissions-Policy`,
   `Cross-Origin-Opener-Policy: same-origin`,
   `Cross-Origin-Embedder-Policy: credentialless`, and `Strict-Transport-Security`
   with preload in production. HMR-relevant `ws://` and the AI Studio image
   origins are allow-listed only in development.

Operational defences include:

- JSON body limit (`10kb`) and a middleware that converts `SyntaxError`s into
  `400` responses instead of crashing Node.
- IP-keyed in-memory rate limiter (15 requests / minute) with a periodic sweep
  to drop stale buckets, plus a `Retry-After` hint on `429` responses.
- `app.disable("x-powered-by")` and `trust proxy` configured for typical
  reverse-proxy deployments.
- `SIGTERM` / `SIGINT` graceful shutdown handlers close the HTTP server and the
  sweep interval cleanly.
- Secrets are loaded strictly via `dotenv` and `GEMINI_API_KEY` absence does
  not crash the server — it logs a warning and falls back to simulation.
- `/api/health` exposes a non-sensitive liveness probe.

---

## Accessibility

- Form controls have explicit `<label htmlFor>` bindings; the required
  textarea exposes its helper via `aria-describedby`.
- Crowd-density selection uses a `role="radiogroup"` with `aria-checked` radios;
  PA language selection uses a `role="tablist"` with `aria-selected` tabs.
- The SVG stadium map declares `role="img"` plus `<title>`/`<desc>` labelled
  regions; each sector group is keyboard-focusable (`tabIndex=0`) and activates
  on `Enter` / `Space`.
- Tables include a `sr-only` `<caption>` and `scope="col"`/`scope="row"`
  headers; the audit log restore button announces active vs. restore intent via
  `aria-label`.
- Error announcements use `role="alert"`; the broadcast simulator screen uses
  `aria-live="polite"` so dynamic updates are read by AT.
- All decorative icons are marked `aria-hidden="true"`; reduced-motion
  preferences disable animations via a global media query
  (`src/index.css`).
- Focus order is preserved via the source-order layout; every interactive
  element has a `focus-visible:outline-2 outline-cyan-400` affordance.

---

## Testing

Tests use Node's built-in test runner via `tsx` (no Jest/Vitest dependency).

```bash
npm test                      # all 17 rules
npm run lint                  # tsc --noEmit typecheck
```

Coverage spans, in the `orchestration safety rules` suite:

- HTML/`javascript:` sanitisation while preserving legitimate text.
- Required-field, type, whitelist, and length validation; rejection of unknown
  density values.
- Critical-incident escalation (medical, crush, fire, structural, respiratory,
  smoke/pyro) to Priority 1.
- Density-driven fallback priority (2 / 3 / 4) for routine narratives.
- Sector resolution for `west gate`, `south east`, `gate c`, `turnstile`,
  `north gate`, `east gate`, `south gate`, `stairwell`, `gate b`, and a
  deterministic default for unrecognised text.
- Immutable density updates with capacity-derived head counts.
- Rerouting that excludes both `High` and `Critical` neighbours (with `[]` for
  unknown/missing/undefined active ids).
- Deterministic simulation payload including the `STAD-2026-XXXX` id format.
- Priority label + Tailwind badge mapping.
- `validateIncidentResult` acceptance of well-formed payloads and rejection of
  null/empty/out-of-range/directiveless payloads.
- Polygon centroid correctness and invalid-coordinate fallback.

---

## Folder Structure

```text
vanguard-core/
├── index.html
├── server.ts                 Express + Vite + Gemini entrypoint
├── vite.config.ts            SPA build configuration (Tailwind, React, HMR)
├── tsconfig.json
├── metadata.json             AI Studio discovery metadata
├── .env.example
├── src/
│   ├── App.tsx               Top-level state container
│   ├── main.tsx
│   ├── index.css             Tailwind + reduced-motion rules
│   ├── data.ts               Stadiums, phases, sectors, presets, seed history
│   ├── types.ts              Shared domain types (also used by server + tests)
│   ├── components/
│   │   ├── ActionResultsPanel.tsx
│   │   ├── BroadcastSimulator.tsx
│   │   ├── Header.tsx
│   │   ├── IncidentAuditTrail.tsx
│   │   ├── PresetScenarios.tsx
│   │   ├── StadiumMap.tsx
│   │   └── TelemetryForm.tsx
│   └── lib/
│       ├── config.ts         Tunable constants + lookup sets
│       ├── sanitize.ts        Defence-in-depth text scrubbing
│       ├── validation.ts      Request payload validation
│       ├── severity.ts        Deterministic triage engine
│       ├── sectors.ts         Affected-sector + rerouting + centroid maths
│       ├── simulation.ts      Offline fallback IncidentResult builder
│       ├── prompt.ts          Gemini system prompt builder
│       ├── aiResponse.ts      Defensive re-validation of model output
│       ├── priority.ts        Priority label + badge helpers
│       └── index.ts           Public barrel
├── tests/
│   └── orchestration.test.ts
├── docs/                      Production build output (gitignored artefacts)
└── assets/
```

---

## Scalability

- **Stateless server** – `server.ts` holds no per-session state; the only
  in-memory structure is the rate-limit Map, swept periodically and bounded by
  the active IP set. The process is horizontally scalable behind a load
  balancer.
- **Deterministic core** – Severity, routing, and simulation logic are pure
  functions exported through `src/lib`. They can be lifted into a worker,
  serverless function, or a separate service without modification.
- **Schema-stable contracts** – `validateIncidentResult` enforces the JSON
  incident schema on every AI response, so model upgrades (e.g. switching the
  default `GEMINI_MODEL`) cannot silently break the client.
- **Tunable rate limits** – `RATE_LIMIT.*` and `HTTP_BODY_LIMIT` in
  `src/lib/config.ts` make it trivial to retune for a specific venue without
  editing controller code.

---

## Trade-offs

- **In-memory rate limiting** is cheap and dependency-free but does not survive
  restarts and is per-process. For load-balanced deployments, swap in Redis or
  a shared store by replacing the `ipRequestCounts` Map.
- **Offline simulation** deliberately mirrors the AI schema but is intentionally
  less nuanced than a live model. Retaining it lets the operator test routes
  during a Gemini outage without losing the dashboard.
- **No persistent storage** – the audit trail lives in React state and resets
  on reload. This keeps the demo dependency-free; production deployments would
  back it with a real operational log (Postgres/SIEM).
- **SVG density visualisation** is hand-crafted for 8 illustrative sectors
  rather than rendered from real GIS data. It keeps the bundle small and the
  interaction model keyboard-accessible.
- **SpeechSynthesis** is opt-in and lazy-loaded. Some venues restrict audio
  hardware, so the simulator offers both the visual giant-screen script and
  optional voice playback.

---

## Future Improvements

- Persist incident history to a backend store (Postgres/SIEM) with retention
  policies aligned to FIFA safety regulations.
- Replace the in-memory rate limiter with a token-bucket Redis implementation
  for multi-instance deployments.
- Stream Gemini responses via the SDK's streaming API for faster perceived
  orchestration latency.
- Add OpenTelemetry tracing around `/api/orchestrate` for SLO dashboards.
- Replace the static sector adjacency list with venue floor-plan ingestion to
  generate routing topology from real GIS data.
- Add i18n for the dashboard chrome itself (currently only the PA scripts are
  multilingual).
- Add an automated load and fuzz harness against the validation pipeline.
- Add a feature flag service to A/B test different decision protocols.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment variables:

```bash
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-3.5-flash"
PORT=3000
```

If no Gemini key is configured, Vanguard-Core uses deterministic offline
simulation.

## Verification

```bash
npm run lint                  # tsc --noEmit typecheck
npm test                      # 17 orchestration safety rules
npm run build                 # Vite + esbuild server bundle
npm audit --omit=dev --audit-level=moderate
```

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS 4, Lucide icons.
- Express API server with `@google/genai`.
- Node's built-in test runner with `tsx`.

## License

Copyright 2026 FIFA World Cup Stadium Logistics Division — Vanguard-Core Orchestrator v2.0.0. Ingress and egress safety compliant model.
