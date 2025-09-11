# Contributing

Thanks for improving GetLocalRanked! This guide covers setup, workflow, and expectations. For detailed conventions, see Repository Guidelines.

## Quick Start
- Clone and install: `npm install`
- Environment: copy `.env.example` → `.env.local` (do not commit secrets)
- Dev server: `npm run dev` (http://localhost:3001)
- CSS: `npm run css:watch` during development; `npm run build:css` for builds

## Development Workflow
- Create a feature branch: `feature/<short-scope>` or `fix/<short-scope>`
- Keep changes focused and small; update related tests and docs
- Run checks locally before opening a PR

## Code Style & Tests
- TypeScript, 2-space indent, strict typing; avoid `any`
- Validate: `npm run type-check` and `npm run lint`
- CSS lint/build: `npm run css:lint` and `npm run build:css`
- E2E tests (Playwright):
  - First-time: `npm run test:install`
  - Headless: `npm test`
  - Debug UI: `npm run test:ui`
  - Reports: `npm run test:report`

## Commit & PR Guidelines
- Use Conventional Commits where possible (e.g., `feat:`, `fix:`, `chore:`)
- PRs must include: summary, scope, linked issues, screenshots for UI changes, and a brief test plan
- Update docs under `docs/` when APIs, routes, or UX meaningfully change

## Useful Links
- Repository Guidelines: `./AGENTS.md`
- Project README (setup, routes, docs map): `./README.md`
- Technical docs: `./docs/`

By contributing, you agree to follow the style, testing, and security guidance in the Repository Guidelines.
