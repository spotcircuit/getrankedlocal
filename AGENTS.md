# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js App Router (API under `app/api/`), pages use `page.tsx`/`layout.tsx`; directory routes at `app/directory/[service]/[state]/[city]/`.
- `components/` — Reusable React components (PascalCase filenames).
- `styles/` — Modular CSS built to `public/styles/`; images in `public/images/`.
- `tests/` — Playwright specs (`*.spec.ts`); `test/` contains legacy JS tests.
- `docs/` — Architecture, API, SEO docs; `scripts/` for data/utilities; `migrations/` and SQL in repo root when applicable.

## Build, Test, and Development Commands
- `npm run dev` — Start app at `http://localhost:3001`.
- `npm run build` / `npm run start` — Production build and serve.
- `npm run type-check` — TypeScript check (`tsc --noEmit`).
- `npm run lint` — Next/ESLint checks.
- `npm run build:css` — Lint, build, and minify CSS; `npm run css:watch` for dev.
- `npm test` — Run Playwright E2E; `npm run test:ui` (debug UI), `npm run test:report`, `npm run test:install` (first‑time browsers).

## Coding Style & Naming Conventions
- TypeScript, 2‑space indent; keep imports clean and local to usage.
- React function components; hooks at top; avoid default exports for components.
- Components: `components/FooBar.tsx` (PascalCase). Routes: lowercase, hyphenated segments; dynamic `[param]` folders.
- Prefer strict typing; avoid `any`. Run `npm run type-check` before PR.
- CSS: use tokens and modules in `styles/`; run `npm run css:lint`.

## Testing Guidelines
- Place E2E specs in `tests/` named `*.spec.ts`.
- Playwright base URL is `http://localhost:3001` and auto‑starts the dev server (see `playwright.config.ts`).
- For debugging, use `npm run test:ui` or `npm run test:headed`.
- Keep tests independent and fast; prefer fixtures/mocks over live services.

## Commit & Pull Request Guidelines
- Use imperative present tense; prefer Conventional Commits (`feat:`, `fix:`, `chore:`). Keep subject ≤ 72 chars.
- PRs should include: clear summary/scope, linked issues, screenshots for UI changes, and a test plan.
- Update docs in `docs/` when APIs or behavior change.

## Security & Configuration Tips
- Copy `.env.example` → `.env.local`; never commit secrets (e.g., `DATABASE_URL`).
- Python utilities live under `api/` and `scripts/`; frontend runs on port 3001.

## Agent‑Specific Instructions
- Make minimal, targeted changes; preserve structure and naming.
- Reflect changes in tests and docs; run `npm run type-check` before proposing patches.
