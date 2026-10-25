# Gatherly AI — Your Personal Event Planner

> **PromptWars Challenge 5 · Celebration & Event Planner**

**Every detail, beautifully planned.**

Gatherly AI is a complete, offline-capable event-planning web application built with React + Vite. It helps you plan weddings, birthday parties, and community events with smart budgeting, task management, vendor tracking, and a built-in planning assistant — all without requiring any AI API, backend, or internet connection.

---

## Features

| Section | What it does |
|---|---|
| **Dashboard** | Overview of events, deadlines, stats, selected event budget summary, and quick actions |
| **Plan an Event** | 4-step wizard: name/date → guests/budget → style → review & generate |
| **My Events** | Browse, open, edit, duplicate, and delete saved events with budget scaling |
| **Budget Planner** | Category-by-category budget allocation with overspending warnings & event switching |
| **Timeline & Checklist** | Auto-generated tasks with deadlines, filtering, custom task support & event switching |
| **Vendor Manager** | Track vendors with status, filter by category/status/event, and side-by-side **Quote Comparison** |
| **Inspiration & Ideas** | Curated ideas filtered by occasion, budget tier, and category |
| **Gatherly Assistant** | Local rule-based planning advice, theme/dietary personalization, and one-click **Generate Plan** |
| **Settings** | Export JSON backup, import JSON backup, load demo data, and clear data |

---

## Technology Stack

- **React 18** + **Vite 6** — fast development and static builds
- **Tailwind CSS 3** — custom design system (ivory, sage green, champagne gold palette)
- **Lucide React** — lightweight icons
- **Vitest + React Testing Library** — automated tests
- **localStorage** — all data persisted client-side, no server needed

---

## About the Planning Assistant

The Gatherly Assistant is **not connected to any AI API or external service**. It works entirely offline using:

- **Keyword/intent matching** on user input
- **Deterministic response templates** per occasion type
- **Contextual rules** based on budget, guest count, days remaining, task state, theme selection, and dietary preferences
- **One-click "Generate Plan" action** that recalculates a holistic event roadmap
- **Pre-written advice** for budget splits, decorations, food, venues, vendors, and more

All budget figures displayed by the assistant are **illustrative estimates** based on typical event ratios, not market quotes. This is clearly disclosed in the UI.

---

## Architecture

```
src/
├── App.jsx              # Root component + floating assistant panel
├── main.jsx             # React entry point
├── index.css            # Global styles + Tailwind directives + accessibility focus & reduced-motion
├── context/
│   └── AppContext.jsx   # Global state (useReducer + localStorage persistence)
├── components/
│   ├── ui/index.jsx     # Reusable UI primitives (Button, Card, Modal, Input, Select, etc.)
│   ├── Sidebar.jsx      # Responsive navigation with active event indicator
│   ├── Dashboard.jsx    # Dashboard overview with selected event budget card
│   ├── EventWizard.jsx  # Multi-step event creation form with validation
│   ├── MyEvents.jsx     # Event list, editing modal, duplication, and deletion
│   ├── BudgetPlanner.jsx# Budget categories, allocation bar, and event switcher
│   ├── Checklist.jsx    # Task management with priorities, deadlines & custom tasks
│   ├── VendorManager.jsx# Vendor CRUD, filters, and Price Comparison view
│   ├── Inspiration.jsx  # Occasion & budget-filtered idea gallery
│   ├── Assistant.jsx    # Chat UI for rule-based assistant with Generate Plan
│   └── Settings.jsx     # Data management (Export & Import JSON backup, demo restore)
├── utils/
│   ├── helpers.js       # Currency (INR), dates, budget calculations, validation, price comparison
│   ├── tasks.js         # Task template engine with occasion-specific offsets
│   ├── assistant.js     # Rule-based response engine with intent recognition
│   └── storage.js       # Safe localStorage wrapper with error boundaries
├── data/
│   ├── ideas.js         # Curated inspiration dataset + filtering
│   └── demo.js          # Sample data generator
└── test/
    ├── setup.js          # Test environment setup
    └── core.test.js      # 67 comprehensive automated tests
```

### Key Planning Rules

- **Budget allocation** uses percentage rules per occasion type (wedding: 30% venue, 30% catering…)
- **Task deadlines** are calculated relative to the event date (e.g. "Book venue" = 150 days before)
- **Urgency levels**: critical (≤3 days), high (≤7), medium (≤14), normal (>14)
- **Budget tiers**: budget (<₹500/person), medium (<₹2000/person), premium (≥₹2000/person) — used to filter inspiration ideas
- **Vendor Comparison**: calculates category minimum, maximum, average quotes, and highlights potential savings

---

## Assumptions and Limitations

- All data is stored in the browser's `localStorage` only — it will be lost if browser storage is cleared (use Export Backup to preserve data)
- No user authentication — designed for single-user, local use
- Prices shown are **estimates only** — not connected to real vendor marketplaces
- The assistant responds to defined intent categories via keyword matching; it does not claim to be generative AI
- Tested on modern Chrome, Firefox, Safari, and Edge; IE is not supported

---

## Installation & Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Testing

```bash
npm test
```

67 automated unit tests cover:
- Currency formatting (INR) and string number parsing
- Budget allocation totals, scaling, and overspending detection
- Event form validation (name, occasion, valid date formats, positive guests, positive budget)
- Checklist completion and progress calculations
- Date utilities (daysUntil, urgencyLevel, labels, past/today handling)
- Task generation per occasion with urgency adjustment
- Assistant response variations by occasion, budget, theme, and dietary preferences
- Assistant structured plan generation
- Occasion & community support verification
- Vendor filtering (category, status, eventId)
- Vendor price comparison (grouping, min/max/average quotes, savings)
- Storage persistence, round-trip serialization, activeEventId retention, and corrupted JSON failure handling

---

## Production Build

```bash
npm run build
```

Output is in the `dist/` directory — a fully static site with no server required.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import the repository in [vercel.com](https://vercel.com)
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Deploy

A `vercel.json` configuration file is included in the root directory for seamless static SPA routing and builds. No environment variables required.

### Netlify

1. Push to GitHub
2. Import the repository in [netlify.com](https://netlify.com)
3. Set **Build Command**: `npm run build`
4. Set **Publish Directory**: `dist`
5. Deploy

A `netlify.toml` is included for automatic configuration.

---

## Data & Privacy

- **No data leaves your browser.** All events, vendors, and ideas are saved only in `localStorage`.
- **No tracking, analytics, or telemetry.**
- **No API keys required** — the app works completely offline.
- Use **Settings → Export Data** to download a JSON backup at any time.

---

## Repository

- One branch (`main`)
- Under 10 MB (no `node_modules`, `dist`, or large assets committed)
- `.gitignore` excludes build artifacts, dependencies, and IDE files
