# Gatherly AI — Your Personal Event Planner

> **Every detail, beautifully planned.**
>
> An intelligent, context-aware celebration and event planning assistant powered by **Google Gemini** and deterministic planning logic.

---

## Overview & Problem Being Solved

Planning celebrations—weddings, milestone birthdays, and community gatherings—is notoriously stressful. Planners and hosts struggle with:
1. **Unrealistic Budgets & Silent Overruns**: Allocations that don't account for guest headcount, per-plate food realities, or unexpected service fees.
2. **Cascading Requirements**: A simple change (e.g. cutting the budget from ₹8L to ₹6L, or expanding guest headcount from 200 to 300) creates complex ripple effects that existing static checklist apps fail to handle.
3. **Complex Task Dependencies**: Booking caterers or sending formal invitations before locking the venue creates costly mistakes.
4. **Opaque Vendor Quotations**: Vendor quotes often leave out taxes, overtime fees, service charges, or guest capacity bounds, making direct comparison misleading.

**Gatherly AI** solves this by unifying **Google Gemini generative intelligence** with **deterministic, priority-weighted budget calculations**, dependency-linked timelines, vendor quotation comparisons, and change-aware planning.

---

## Target Users & Persona

- **Independent Event Planners & Hosts**: Individuals organizing major life events (weddings, anniversaries, birthdays) seeking guidance on realistic allocations and vendor trade-offs.
- **Budget-Conscious Organizers**: Planners needing clear visibility into trade-offs (e.g., how to reduce expenses without compromising core priorities like catering or memories).
- **Community & Corporate Committees**: Groups coordinating gatherings requiring clear timelines, volunteer roles, and itemized vendor quotes.

---

## Key Features

| Feature | Description |
|---|---|
| **Demo Login Screen** | Clean, accessible authentication gate with visible demo credentials, show/hide password, and zero loss of local event data. |
| **Contextual AI Assistant** | Powered by **Google Gemini 3.8 Flash** via a secure server-side endpoint. Evaluates active event budget, headcounts, priorities, timeline, and vendor quotes to provide grounded recommendations. |
| **Change-Aware Planning** | Modifying budget, guest count, or event date automatically calculates ripple effects, highlights affected decisions, and suggests concrete trade-offs without erasing user data. |
| **Priority-Driven Budget Planner** | Automatic contextual category allocations in Indian Rupees (INR ₹). Real-time detection of over-allocation, per-plate strain, and unallocated buffers. One-click proportional rebalancing. |
| **Dependency-Aware Timeline** | Multi-phase checklist with explicit prerequisite links (e.g. Venue confirmation blocks dependent catering/invitation tasks), status indicators, overdue alerts, and automated rescheduling on date shifts. |
| **Vendor Quotation Comparison** | In-depth vendor analysis comparing base quotes, guest capacity, per-guest rates, additional charges (taxes, transport, overtime), and missing details requiring clarification. |
| **Curated Inspiration Gallery** | Occasion-specific, tier-filtered concepts and themes with direct cost implications. |
| **Secure Data Management** | JSON backup export and schema-validated JSON import with sanitization and protection against malicious payloads. |

---

## Technology Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS 3, Lucide React
- **Generative AI**: Google Gemini API (`gemini-3.8-flash` via Google AI Studio)
- **Backend / Serverless**: Node.js HTTP server (`server.js`) & Vercel/Antideploy serverless functions (`api/chat.js`, `api/health.js`)
- **Testing**: Vitest, React Testing Library, JSDOM (108 automated unit and integration tests)
- **Persistence**: Safe `localStorage` abstraction with fallback boundaries
- **Security & Headers**: In-memory rate limiting, server-side payload validation, XSS prevention, and strict HTTP headers (`nosniff`, `DENY`)

---

## Google Gemini Integration & Architecture

Gatherly AI features a real, secure server-side integration with **Google Gemini**:

```
┌────────────────────────────────┐         POST /api/chat          ┌──────────────────────────────────┐
│   React Frontend (Gatherly)    │ ──────────────────────────────> │   Server-side Endpoint / Node    │
│  - Never exposes GEMINI_API_KEY│                                 │  - Rate Limiter (30 req/min)     │
│  - Client Query Caching        │ <────────────────────────────── │  - Payload Schema Validation     │
│  - Local Rule Engine Fallback  │        JSON Response            │  - Context Injection (Gemini)    │
└────────────────────────────────┘                                 └────────────────┬─────────────────┘
                                                                                    │
                                                                       HTTPS (Gemini 3.8 Flash)
                                                                                    │
                                                                                    ▼
                                                                   ┌──────────────────────────────────┐
                                                                   │     Google AI Studio API         │
                                                                   │ (generativelanguage.googleapis)  │
                                                                   └──────────────────────────────────┘
```

### Security & Secret Protection
- **No Client Exposure**: `GEMINI_API_KEY` is kept exclusively on the server (`process.env`). It is **never** prefixed with `VITE_`, never bundled into client JavaScript, never printed in console logs, and never returned in error responses.
- **Git Protection**: `.gitignore` strictly excludes `.env` and all secret files. Only `.env.example` with placeholder values is committed.
- **Rate Limiting**: In-memory sliding window rate limiter protects server endpoints (max 30 requests per minute per client).
- **Graceful Resilience**: If the Gemini API is unreachable, quota-limited, or unconfigured, Gatherly seamlessly falls back to its deterministic local smart planner, displaying a clear transparency notice.

---

## Benchmark Scenario: Priya & Arjun Wedding

To evaluate Gatherly AI's change-aware planning, test this exact scenario (pre-loaded in demo data):

1. **Initial Parameters**:
   - Occasion: Wedding
   - Budget: ₹8,00,000
   - Guest Count: 200 guests (~₹4,000/head)
   - Timeline: 4 months (120 days) remaining
   - Priorities: Food & Catering (High), Venue (High), Photography (High), Decor (Medium)
   - **Baseline Result**: Generates a contextual budget split (Venue: ₹2.4L, Catering: ₹2.4L at ~₹1,200/plate, Decor: ₹1.2L, Photography: ₹96K). Timeline sets Venue booking as a blocking dependency for Caterer and Invitations.

2. **Budget Reduction Test (₹8,00,000 ➔ ₹6,00,000)**:
   - Edit the event budget in **My Events** or adjust in **Budget Planner**.
   - **System Reaction**: Detects `budget_reduced` conflict. Identifies category over-allocations. Recalculates category allocations while preserving previously entered spend.
   - **Trade-Off Recommendations**: Protects high-priority catering and venue. Suggests cutting non-core decor (local seasonal florals saves ~₹22,000) and switching to digital invitations (saves ~₹10,000).

3. **Guest Count Surge Test (200 ➔ 300 Guests)**:
   - Edit guest count to 300 in **My Events**.
   - **System Reaction**: Flags `guest_increase` alert. Calculates approx +₹1,20,000 in additional catering and seating expenses. Highlights per-plate strain and recommends reviewing venue capacity.

---

## Honest Generative AI Disclosure

In accordance with transparent AI principles:
- **Where Generative AI is Used**: Google Gemini (`gemini-3.8-flash`) is used for conversational planning assistance, qualitative trade-off explanations, vendor quotation clarification questions, and customized event themes.
- **Where Deterministic Logic is Used**: Budget sums, percentage allocations, remaining balances, days-to-event countdowns, task dependency graphs, and JSON validation are calculated deterministically using robust JavaScript algorithms to prevent mathematical hallucination.
- **Development Tooling**: Antigravity was utilized as an AI-assisted development pair programmer. All architectural decisions, security boundaries, test cases, and quality reviews were guided and verified by the developer.

---

## Demo Login Credentials

For demonstration and hackathon evaluation:

- **Email**: `demo@gatherly.app`
- **Password**: `Gatherly2026!`

> **Transparency Note**: This login screen provides a structured preview gate and user session state. It stores session data in `localStorage` without sending credentials across the network. All user-created events and configurations remain preserved locally across sessions.

---

## Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm 9+

### 1. Clone & Install
```bash
git clone https://github.com/Rohit-Sawant-02/gatherly-ai.git
cd gatherly-ai
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory (already gitignored):
```env
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173`. Vite's development middleware securely handles `/api/chat` requests using the server-side API key.

### 4. Run Production Build & Standalone Server
```bash
npm run build
npm start
```
Starts the high-performance Node HTTP server serving both the static SPA and `/api/chat` on `http://localhost:3000`.

### 5. Run Automated Tests
```bash
npm test
```
Executes 108 automated unit and integration tests across currency helpers, budget calculators, task dependency resolvers, vendor analyzers, demo authentication, and Gemini services.

---

## Deployment Compatibility

- **Existing Deployment**: [https://gatherly-ai-livid.app/](https://gatherly-ai-livid.app/)
- **Final Deployment**:
[https://gatherly-ai.antideploy.app/](https://gatherly-ai.antideploy.app/)
- **Target Platforms**: Antideploy, Vercel, Netlify, or any Node.js container environment.
- **Vercel / Antideploy Serverless Functions**:
  - `api/chat.js` handles serverless POST requests with rate limiting and input sanitization.
  - `api/health.js` reports deployment health andapability status.
  - `vercel.json` and `netlify.toml` include strict security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **Required Server Environment Variable**:
  - Set `GEMINI_API_KEY` in the hosting provider's environment variables dashboard.

---

## Known Assumptions & Limitations

1. **Estimates vs Confirmed Contracts**: All vendor pricing benchmarks, per-plate costs, and trade-off savings are planning estimates based on Indian event industry conventions. Users must verify final terms directly with vendors.
2. **Client-Side Storage**: In the current architecture, event and vendor data resides in the browser's `localStorage`. Use the **Export Backup** feature in Settings before clearing browser caches.
3. **Demo Authentication**: The login gate is intended for demonstration and evaluation preview. Production deployment requires an enterprise identity provider (e.g., OAuth 2.0 / Firebase Auth / Supabase).
