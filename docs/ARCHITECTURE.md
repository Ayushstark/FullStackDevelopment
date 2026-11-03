# DevRhythm architecture

## Current repository

The application uses JavaScript ES modules throughout. The frontend is React with Vite and JSX; `src/app` composes the app, `src/features` contains product pages, `src/shared` contains reusable components, state, sample data, and services, and `src/styles` contains CSS. The backend is an Express API on Node.js. It uses MongoDB through Mongoose when available and a local JSON fallback store for development.

The current checkout includes inherited opportunity, application, and assistant scaffolding alongside the practice and growth UI. These modules are part of the existing codebase; they do not define the product's future scope. Product work is directed toward DevRhythm, a multi-platform coding activity and streak analyzer. Changes to remove or replace existing modules are separate implementation work, not part of this documentation update.

```text
src/
  app/                 application composition and navigation
  features/            dashboard, growth, calendar, settings, and inherited modules
  shared/
    components/        reusable UI and application shell
    context/           shared application state
    data/              sample data
    services/          API services
  styles/              global CSS
server/                 Express API, models, middleware, fallback store
docs/                    project and engineering documentation
.github/                 workflows, templates, ownership, automation
```

## Intended platform activity flow

```text
Supported coding platforms
  -> server-side platform adapters
    -> validated, normalized activity records
      -> persistence and refresh metadata
        -> streak calculations and consistency summaries
          -> React dashboard
```

This is the intended boundary, not a claim that live platform integrations are already implemented. Adapter design must respect platform APIs, terms, access controls, and rate limits. Preserve the originating platform and retrieval time so users can inspect the basis for an analysis.

## Local development

- `npm run dev` starts Vite on port 5173 and the Express API on port 5000.
- Vite proxies `/api` requests to the local API.
- MongoDB is optional for local startup; without it, the API uses a local fallback store.
- `server/local_db.json` is generated, ignored development state. Do not commit it or use production data locally.
- ESLint checks JavaScript and JSX; the project does not use TypeScript.

## Engineering rules

- Use JavaScript and JSX. Follow the Airbnb JavaScript Style Guide through the repository's ESLint baseline.
- Keep platform-specific parsing and access behavior inside platform adapters.
- Validate external activity data before storing or analyzing it.
- Preserve source identifiers, activity dates, retrieval time, and uncertainty.
- Keep source-reported facts distinct from derived streak calculations.
- Represent loading, empty, stale, partial, error, and permission states explicitly.
- Never expose platform credentials or provider secrets in browser code.
