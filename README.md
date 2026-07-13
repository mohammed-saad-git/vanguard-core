# Vanguard-Core: GenAI Stadium Command & Control Orchestrator

<div align="center">
  <img width="1200" height="475" alt="Vanguard-Core Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

---

## 🏟️ Project Overview
**Vanguard-Core** is an advanced Command & Control (C2) event operations dashboard designed for the **FIFA World Cup 2026**. It leverages **Google Gemini 3.5** to ingest real-time stadium telemetry (such as crowd density levels, match phases, and staff incident logs) and dynamically coordinates emergency response plans, dynamic crowd re-routing, and multilingual public address (PA) speech announcements.

Built with a premium dark-themed command center interface, it ensures fast, automated, and secure crowd control sequencing to protect fan safety and optimize logistics.

---

## ⚡ Core Features

*   **Ingestion Portal**: Support for live staff telemetry logs, match phases, and target stadium presets.
*   **Dynamic Telemetry Grid Map**: Interactive SVG-based visualization of sector occupancy densities (Low, Medium, High, Critical) with real-time fan re-routing path indicators.
*   **Structured Severity Assessments**: Instant determination of incident urgency, impact radius, and priority levels using Gemini JSON schemas.
*   **Tactical Action Plans**: Auto-generated step-by-step responder directives and volunteer deployment guidelines.
*   **PA Audio Broadcast Simulator**: Local text-to-speech audio simulation of emergency warnings translated into English, Spanish, and playing teams' native languages (e.g., German, Portuguese, Japanese).
*   **Incident History Audit Logs**: Persistent history trail table allowing operators to review or restore past tactical decisions.

---

## 🛡️ Production-Grade Security Standards
Designed for deployment under strict operational conditions, Vanguard-Core implements key security defenses:
1.  **Prompt Injection Mitigation**: Rigid data boundary directives in the Gemini prompt template force the model to treat variables strictly as untrusted data inputs, ignoring hijack commands.
2.  **In-Memory Rate Limiting**: REST endpoint rate limiting (max 15 requests/min per IP) to prevent brute-force API spamming.
3.  **OWASP Security Headers**: Custom express middleware configuring `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and a scoped `Content-Security-Policy`.
4.  **Payload Validation & Sanitization**: Restricts body parsing size (`10kb`), strictly validates fields against allowed enums, and strips malicious HTML/JS scripts to prevent Cross-Site Scripting (XSS).

---

## 🛠️ Tech Stack

*   **Frontend**: React (v19), Tailwind CSS, Lucide React Icons, HTML5 Canvas/SVG, SpeechSynthesis API.
*   **Backend**: Node.js, Express, TypeScript (`tsx` runner), `@google/genai` (Gemini SDK).
*   **Build/Development**: Vite, ESBuild, TypeScript Compiler.

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   NPM (v9+)

### Installation & Run Locally

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/mohammed-saad-git/vanguard-core.git
    cd vanguard-core
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory:
    ```bash
    GEMINI_API_KEY="your_gemini_api_key_here"
    PORT=3000
    ```
    *Note: If no API key is specified, Vanguard-Core will automatically activate its offline simulation fallback mode.*

4.  **Launch the Development Server**
    ```bash
    npm run dev
    ```
    Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

5.  **Build and Run for Production**
    ```bash
    npm run build
    ```
    To start the production server:
    ```bash
    npm start
    ```

---

## 🏗️ Folder Structure

```
vanguard-core/
├── src/
│   ├── components/            # UI Components (Header, Map, Ingestion Form, Audit Trail)
│   │   ├── BroadcastSimulator.tsx
│   │   ├── Header.tsx
│   │   ├── IncidentAuditTrail.tsx
│   │   ├── PresetScenarios.tsx
│   │   ├── StadiumMap.tsx
│   │   └── TelemetryForm.tsx
│   ├── App.tsx                # Main App Entry and state orchestration
│   ├── data.ts                # Stadium details and scenario preset data
│   ├── types.ts               # TypeScript Interfaces
│   └── main.tsx
├── server.ts                  # Secured Express API Backend & Vite dev server integration
├── vite.config.ts             # Bundler Configurations
├── tsconfig.json              # TypeScript Options
└── package.json
```
