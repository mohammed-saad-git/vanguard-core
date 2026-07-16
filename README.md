# Vanguard-Core: GenAI Stadium Command and Control Orchestrator

Vanguard-Core is a FIFA World Cup 2026 stadium operations dashboard for incident telemetry, crowd-density monitoring, emergency routing, and multilingual public-address broadcasts.

## Core Features

- Telemetry ingestion for stadium, match phase, teams, crowd density, and incident reports.
- Interactive SVG stadium map with sector density, affected-sector highlighting, and reroute indicators.
- Severity assessment with deterministic critical escalation for medical, crush, fire, and structural risks.
- Tactical action plans for dispatch, staff assignment, and crowd-flow instructions.
- PA broadcast simulator with English, Spanish, and localized-team-language scripts.
- Incident audit trail for reviewing and restoring past operational decisions.

## Security And Safety

- Strict request validation for stadium names, match phases, density levels, and text length.
- Shared sanitization for API and client fallback behavior.
- Prompt-injection boundary in the Gemini prompt: telemetry is treated as untrusted data.
- JSON body size limit, in-memory rate limiting, and production-safe security headers.
- Offline simulation fallback when `GEMINI_API_KEY` is unavailable.

## Accessibility And Quality

- Form controls have explicit labels and error announcements.
- Sector map regions and audit actions support keyboard operation.
- Tables include captions and scoped headers.
- Reduced-motion preferences are respected.
- Core routing, severity, sanitization, and simulation rules are covered by Node tests.

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS, Lucide icons.
- Express API server with `@google/genai`.
- Node's built-in test runner with `tsx`.

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

If no Gemini key is configured, the app uses deterministic offline simulation.

## Verification

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=moderate
```

## Project Structure

```text
vanguard-core/
├── src/
│   ├── components/
│   ├── lib/orchestration.ts
│   ├── App.tsx
│   ├── data.ts
│   ├── index.css
│   └── types.ts
├── tests/orchestration.test.ts
├── server.ts
├── vite.config.ts
└── package.json
```
