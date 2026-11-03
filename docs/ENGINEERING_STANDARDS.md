# DevRhythm engineering standards

These standards apply to every code change in this repository. Read this document **before starting a contribution**. Use the standards together with the existing codebase, repository ESLint configuration, and relevant feature documentation. When a constraint conflicts with a framework or platform API, follow the required API contract and keep the exception at that boundary.

## 1. Project baseline

- Use JavaScript ES modules, React JSX, CSS, Node.js, Express, and MongoDB as appropriate to the existing application. Do not introduce TypeScript.
- Run the repository's ESLint configuration and preserve its conventions. Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) for JavaScript style.
- Keep changes focused. Do not introduce a new dependency, abstraction, or architectural pattern without a concrete need.

## 2. JavaScript and clean functions

- Prefer `const`; use `let` only when reassignment is needed. Do not use `var`.
- Use descriptive names and explicit conditions. Prefer strict equality, except intentional nullish comparisons where the lint configuration allows them.
- Keep functions focused on one responsibility and use guard clauses to handle invalid preconditions early.
- Keep functions to two positional arguments or fewer. When more related inputs are needed, accept one clearly named options object and destructure the required fields. Preserve signatures imposed by framework callbacks and external interfaces.
- Keep business rules in small, testable functions. Prefer pure functions for calculations and transformations; isolate network, storage, time, and other side effects at their boundaries.
- Validate untrusted input at system boundaries. Handle expected failures explicitly and preserve useful context. Do not use broad `try/catch` blocks that hide errors or silently return `null`; catch errors where the code can meaningfully recover, otherwise propagate them to the established error boundary.
- Apply SOLID principles through focused modules, clear contracts, composition, and dependency boundaries. They do not require class-heavy designs.
- Choose abstractions and design patterns only when they reduce real duplication or coupling. Avoid speculative generality.

## 3. React and feature boundaries

- Keep product code organized by domain under `src/features/<feature>/`. Place feature-specific components, hooks, API access, state, and utilities within that feature when present and useful.
- Shared code belongs in `src/shared` only when it serves more than one feature or is genuinely application-wide.
- Keep dependencies flowing from shared code to features to app composition: shared modules must not depend on features, and features must not depend on the app layer. Compose multiple features at the app boundary rather than importing one feature's internals into another.
- Keep component interfaces small. Treat props as read-only; derive local values or state rather than mutating props or nested values received through props.
- Use each feature's root `index.js` as its public export surface when other parts of the app need that feature. Do not expose private implementation details. Within a feature, prefer direct imports; avoid chains of barrel files that create cycles or obscure dependencies.
- Extract a component when it represents a coherent UI unit or keeps a component focused. Avoid splitting code into files without a meaningful boundary.

## 4. CSS and UI

- Keep styles modular and close to the component or feature they serve, following the existing CSS setup.
- For new or substantially updated component styles, use explicit BEM naming: `block`, `block__element`, and `block--modifier`. Avoid broad selectors that leak styles into unrelated features.
- Preserve responsive behavior, keyboard access, visible focus, semantic HTML, and accessible names when changing UI.

## 5. MongoDB and data access

- Design documents around the application's read and update patterns. Embed data that belongs to the same aggregate and is commonly read or updated atomically.
- Avoid expensive cross-collection lookups on frequent request paths when embedding or a purpose-built query can meet the need. Use references where independent lifecycles, unbounded growth, or data consistency make embedding unsuitable; document non-obvious trade-offs.
- Validate data before persistence, enforce appropriate schema constraints, and keep database access behind the existing server-side boundary.
- Never expose database credentials, platform tokens, or secrets to browser code or commit them to the repository.

## 6. Comments and documentation

- Write comments to explain non-obvious rationale, constraints, or business rules: **why** the code takes this approach. Do not narrate what the next line already says.
- Keep public interfaces and operational behavior documented where contributors need that context. Update documentation when a change alters setup, architecture, supported platform behavior, or user-visible expectations.

## 7. Testing and review

- Make business logic testable without requiring a live external platform or production database.
- Add or update tests for changed behavior, including relevant boundary and failure cases. Keep tests deterministic; isolate time, network, storage, and randomness when needed.
- Before requesting review, run the relevant checks from the repository quality gate: `npm run lint`, `npm test`, and `npm run build`. Run `npm run audit:production` when dependencies change and network access is available.
- Keep each pull request small and self-contained. Explain its purpose, approach, validation, and any important trade-offs. Respond to review comments with changes or a clear technical rationale.

## 8. Using the references

These references inform the project rules above; project-specific requirements in this document take precedence where examples differ.

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) — JavaScript conventions.
- [Bulletproof React: Project Standards](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md), [Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md), and [Components and Styling](https://github.com/alan2207/bulletproof-react/blob/master/docs/components-and-styling.md) — feature boundaries, React structure, and UI organization.
- [Google Engineering Practices](https://google.github.io/eng-practices/) — small, reviewable changes and author/reviewer practices.
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript) — readable functions, focused responsibilities, testing, and error handling.
- [Microsoft Framework Design Guidelines (PDF)](Microsoft-standard-design-guidelines.pdf) — attached reference for API naming, parameter clarity, and error-contract design. The PDF describes .NET library design; apply only language-independent ideas and do not copy .NET-specific conventions into JavaScript.
