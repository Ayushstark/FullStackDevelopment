# DevRhythm

**Understand your coding consistency across platforms.**

DevRhythm is focused on analyzing coding activity and streaks across supported coding platforms. It aims to bring a user's practice history into one place and make consistency, progress, and gaps easier to understand.

## Product scope

The project is focused on a multi-platform coding streak analyzer. Intended capabilities include:

- Connect or look up coding activity from supported platforms, subject to each platform's available APIs and access rules.
- Show activity and streak history across platforms in a shared dashboard.
- Summarize practice consistency and problem-solving activity over time.
- Preserve the source and retrieval time for platform data, and show when information is unavailable or out of date.

The project is not for internships, jobs, career opportunities, resumes, or application tracking. Platform coverage depends on reliable, permitted access to each platform's activity data. Do not assume every platform exposes equivalent streak or problem-count information.

## Current implementation

The repository is a JavaScript application using Vite and React for the frontend and Express on Node.js for the API. React components use JSX. The frontend currently includes practice and growth views with sample platform data; the backend supports account routes using MongoDB when available and a local JSON fallback store during development. Live platform data connections are future work unless documented as implemented in a specific feature.

| Area | Current implementation |
|---|---|
| Frontend | React with Vite |
| Language | JavaScript ES modules and JSX |
| Styling | CSS |
| Backend | Express on Node.js |
| Persistence | MongoDB with Mongoose, or local JSON fallback |
| Authentication | JWT and bcrypt |
| Quality tools | ESLint and Vitest |
| Deployment | GitHub Pages workflow for the frontend; backend deployment is separate |

## Run locally

Requirements: Node.js 20 or later and npm.

```bash
npm ci
npm run dev
```

The development command starts the frontend at `http://localhost:5173` and the API at `http://localhost:5000`. The API health endpoint is `http://localhost:5000/api/health`. Vite proxies `/api` requests to the local API.

MongoDB is optional for local startup. When it is unavailable, account routes use the development fallback store, which writes ignored local state to `backend/local_db.json`. Do not use production credentials or data for local development.

Run only one process with `npm run dev:client` (or `npm run dev:frontend`) and `npm run server` (or `npm run dev:backend`) in separate terminals.

## Quality checks

```bash
npm run lint
npm test
npm run build
npm run audit:production
```

ESLint checks JavaScript and JSX. This project does not use TypeScript.

## Repository map

```text
frontend/
  src/
    app/               application composition and navigation
    features/          dashboard, growth, calendar, settings, and inherited modules
    shared/
      components/      reusable UI and application shell
      context/         shared application state
      data/            sample data
      services/        shared API services
    styles/            global CSS
  vite.config.js       Vite configuration with API proxy and dist output
  package.json         frontend scripts and dependencies

backend/
  src/
    config/            environment and resilient MongoDB connection
    controllers/       route handlers (auth, user, growth, platform, contest, health)
    middleware/        auth, rate limiter, and error handling middleware
    models/            Mongoose schemas (User, GrowthLog, Opportunity, Application)
    routes/            modular Express routers and route registry
    services/          external platform sync services (CodeChef, LeetCode, GitHub, etc.)
    store/             fallback local resilient JSON store
    utils/             standard API errors, responses, and sanitization
    app.js             Express application setup
    server.js          entry point
  __tests__/           backend Vitest test suite
  package.json         backend scripts and dependencies

docs/                  project and engineering documentation
.github/workflows/     CI, CodeQL, and frontend deployment
```

Before contributing, read [docs/ENGINEERING_STANDARDS.md](docs/ENGINEERING_STANDARDS.md). See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the product plan, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the repository boundaries, [docs/ROADMAP.md](docs/ROADMAP.md) for delivery stages, and [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## Engineering and security

Use JavaScript and JSX for application code. Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript); the repository's ESLint configuration is the executable baseline. Keep platform credentials and secrets out of the browser and repository. Validate external activity data, respect platform access rules, and clearly distinguish source data from derived analytics.
