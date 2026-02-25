# Augment Code ROI Calculator

Sales engineering tool that lets AEs and SEs model financial ROI for Augment Code across four automation use cases. Built as a single-page React app (Create React App) with no backend — runs entirely in the browser.

## Use Cases

Each use case has multiple evaluation categories with configurable inputs:

| # | Use Case | Categories | Key Metric |
|---|----------|-----------|------------|
| 01 | **Code Review** | Throughput, Quality, Senior Capacity | Eng hours recovered from review cycles |
| 02 | **Unit Test Automation** | Velocity, Coverage, CI Stability | Test authoring time reduction |
| 03 | **Build Failure Analyzer** | MTTR, Triage, Pipeline Reliability | Mean time to remediation |
| 04 | **Interactive (IDE + CLI)** | Productivity, Onboarding, Tool Consolidation | Hours saved per dev per week |

### Features

- **Three scenarios** — Conservative / Midpoint / Optimistic savings multipliers
- **Per-category inputs** — Sliders and number fields with validated ranges
- **Pilot success thresholds** — Drag sliders to track actual vs target metrics
- **Summary tab** — Combined ROI across all enabled use cases
- **PDF export** — One-click export via jsPDF (loaded from CDN on demand)
- **Customer branding** — Click-to-edit customer name in header
- **Google OAuth login** — Domain-restricted to `augmentcode.com` accounts

## Authentication

The app uses Google Sign-In (JWT method) to restrict access to `augmentcode.com` accounts. No backend is required — the Google-issued ID token (JWT) is decoded client-side and the `hd` (hosted domain) claim is verified.

### How it works

1. Google Sign-In SDK loads via CDN (`accounts.google.com/gsi/client`)
2. User signs in → Google returns an ID token (JWT)
3. `AuthContext.js` decodes the JWT payload (base64), checks `hd === "augmentcode.com"`
4. Only user profile + token expiry are stored in `localStorage` — the raw JWT credential is never persisted
5. Expired tokens are detected on page load and cleared automatically
6. If the Google SDK fails to load (network error, ad blocker), an error is shown after 10 seconds

### Security note

Client-side JWT decoding does **not** verify the token's cryptographic signature. The `hd` (hosted domain) check is a UX gate — not a security boundary. A motivated attacker could craft a token with any `hd` value. For an internal SE tool with no sensitive backend data, this is acceptable. For anything higher-stakes, verify tokens server-side (as the augment-portal does).

### Setup

```bash
cp .env.example .env
# Edit .env with your Google OAuth client ID
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_GOOGLE_CLIENT_ID` | Yes | — | Google OAuth 2.0 client ID |
| `REACT_APP_ALLOWED_DOMAIN` | No | `augmentcode.com` | Restrict login to this Google Workspace domain. Set to empty string to allow any Google account. |

> **Note:** The Google client ID must have `http://localhost:3000` (dev) and your production URL as authorized JavaScript origins in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Architecture

The app lives in two files:

- `src/App.js` — All UI components and business logic, exporting `B` (colors), `USE_CASES` (config + compute functions), and `fmt` (formatter)
- `src/AuthContext.js` — Google OAuth login, JWT decode, domain validation, session persistence

No routing, no state management library, no backend API calls. All computation is synchronous and deterministic.

## Run Locally

```bash
cp .env.example .env     # Add your Google client ID
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Testing

```bash
npm test           # Watch mode (interactive)
CI=true npm test   # Single run (CI)
```

**71 tests** across 4 test files:

| File | Tests | What it covers |
|------|-------|---------------|
| `use-cases.test.js` | 17 | Data structure integrity, `fmt` formatter, brand colors |
| `compute.test.js` | 15 | Business logic for all 4 use cases × all categories, cross-cutting invariants |
| `App.test.js` | 24 | Component rendering, tabs, enable/disable, customer name, pilot toggle, Summary tab, login screen, loading state, auth errors |
| `AuthContext.test.js` | 15 | JWT decode, token expiry, localStorage restore/clear, credential exclusion, domain validation (workspace, gmail, wrong domain) |

## Build & Deploy

```bash
npm run build      # Production build → build/
```

### Vercel

1. Push to GitHub
2. [vercel.com](https://vercel.com) → Import Project → select this repo
3. Add `REACT_APP_GOOGLE_CLIENT_ID` in Vercel environment settings
4. Deploy

### Static hosting

The `build/` directory is a static site. Serve with any static file server (S3, Cloudflare Pages, Nginx, etc.). Ensure `REACT_APP_GOOGLE_CLIENT_ID` is set at build time (CRA bakes env vars into the bundle).
