# OpportunityOS Frontend

Vite + React single page application with modern UI components, competitive programming profile analytics, contest calendars, application tracking, and growth dashboards.

## Architecture

```
frontend/
├── src/
│   ├── app/                   # App root component
│   ├── components/            # Reusable UI primitives (FlowButton, PillNav, GridScan, etc.)
│   ├── features/              # Feature modules (auth, dashboard, growth, calendar, etc.)
│   ├── shared/                # Shared context, services, and sample data
│   ├── styles/                # Global CSS styles and design themes
│   └── main.jsx               # React DOM entry point
├── index.html
├── vite.config.js             # Vite configuration with /api reverse proxy
└── package.json
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Run Tests
```bash
npm test
```
