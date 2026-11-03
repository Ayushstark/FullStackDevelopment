# Architecture and repository map

## Current starter

The repository uses JavaScript (ES modules) throughout. The frontend is a Vite + React application with JSX; `src/app` composes the application, `src/features` owns product workflows, `src/shared` contains reusable UI, context, services, and sample data, and `src/styles` owns global presentation. The backend is an Express API in `server/`, backed by MongoDB when available and a local JSON fallback store for development. Temporary opportunity fixtures live in `src/shared/data` until API adapters are introduced.

```text
src/
  app/                 composition, navigation, providers
  features/            dashboard, opportunities, growth, calendar, settings
  shared/
    components/        reusable UI and application shell
    context/            shared application state
    data/               fixtures and source adapters
    services/           shared API clients
  styles/              global tokens and responsive styles
server/                 Express API, models, middleware, fallback store
docs/                  roadmap, architecture, operations
.github/               workflows, templates, ownership, dependency automation
```

## Target boundaries

```text
Browser UI (React/JavaScript)
  -> fetch-based API service
    -> Express API (Node.js/JavaScript)
      -> MongoDB (Mongoose) or local JSON fallback
```

The browser must never hold provider secrets. External source data is untrusted until validated, normalized, deduplicated, timestamped, and attributed. AI output is a recommendation, not a source-backed fact.

## Local development

- `npm run dev` starts the Vite frontend on port 5173 and Express API on port 5000.
- Vite proxies `/api` requests to the local API.
- MongoDB is optional for basic local startup; without it, the API reports fallback-store mode.
- `server/local_db.json` is generated local state and is ignored by Git. Do not commit it or use production credentials/data locally.
- ESLint parses and checks JavaScript and JSX; there is no TypeScript compiler or type system configured.

## Change rules

- Keep feature-specific behavior inside its feature module.
- Promote code to `shared` only after a second real use case.
- Define API and database changes before implementing UI assumptions.
- Model loading, empty, error, stale, and permission states explicitly.
- Add telemetry and a rollback path before shipping scheduled jobs or external integrations.
