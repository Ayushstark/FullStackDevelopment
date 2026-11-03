# Contributing to DevRhythm

## Development flow

1. Read [Engineering Standards](docs/ENGINEERING_STANDARDS.md) before making changes.
2. Select or create an issue with a milestone, owner, and acceptance criteria.
3. Create a focused branch from `dev`: `feat/<issue>-short-name`, `fix/<issue>-short-name`, or `chore/<issue>-short-name`.
4. Open a pull request into `dev` for integration testing.
5. Keep changes small, linted, tested, and documented at the boundary they change. Use JavaScript and JSX; do not introduce TypeScript.
6. Promote a tested `dev` release to `main` through a reviewed release pull request.
7. Address review feedback and merge only after required checks pass.

## Branch environments

- `dev` is the integration/testing branch. Pushes run the full CI and CodeQL checks, but never deploy production.
- `main` is the production branch. Only reviewed changes promoted from `dev` should land here; pushes run CI, CodeQL, and production deployment.
- Feature branches should target `dev`, not `main`.

## Local quality gate

```bash
npm ci
npm run lint
npm test
npm run build
```

Do not commit `node_modules`, build artifacts, credentials, or `.env` files. API keys must stay in server-side environments and GitHub Actions secrets.

## Review standard

Reviewers should verify behavior, failure states, accessibility, platform-data attribution, security boundaries, tests, and operational impact. A feature is not complete when only the happy path works.

Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) for JavaScript conventions. The repository's ESLint configuration is the executable baseline; use it to resolve style questions consistently.

All contributions must follow the [DevRhythm Engineering Standards](docs/ENGINEERING_STANDARDS.md).
