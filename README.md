# RALLYGRID

RALLYGRID is a mobile-first board-and-rally game built as a TypeScript monorepo. The repository is designed for browser-first development and can be maintained from an iPhone or Android tablet using a browser IDE and GitHub.

## Technology

- Web: React 19, TypeScript, Vite, Tailwind CSS 4, Phaser 4
- Server: Node.js 22+, Fastify 5, Colyseus
- Data: PostgreSQL 17, Drizzle ORM, Redis 7
- Identity: Supabase Auth client dependency (configure credentials to enable)
- Mobile: Capacitor 8 and PWA shell
- Quality: Vitest, Playwright, ESLint, Prettier
- Workspace: pnpm

## Requirements

Node.js 22 or newer, pnpm 10 or newer, and Docker with Compose for local PostgreSQL/Redis services.

## Quick start

1. Copy `.env.example` to `.env` and configure your environment.
2. Start infrastructure: `pnpm infra:up`.
3. Install dependencies: `pnpm install`.
4. Start web and API: `pnpm dev`.
5. Open the Vite URL shown in the terminal (normally http://localhost:5173).

The API listens on port 2567. `GET /health` reports process health. `GET /ready` actively checks PostgreSQL and Redis and returns HTTP 503 if either dependency is unavailable.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start web and API |
| `pnpm dev:web` | Start web app |
| `pnpm dev:server` | Start API |
| `pnpm infra:up` | Start PostgreSQL and Redis |
| `pnpm infra:down` | Stop infrastructure |
| `pnpm typecheck` | Type-check workspace packages |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest |
| `pnpm test:e2e` | Run Playwright |
| `pnpm build` | Build workspace packages |

## Architecture boundaries

- `apps/web`: React presentation, Phaser rendering, PWA and Capacitor shell.
- `apps/server`: HTTP API, Colyseus transport, infrastructure connections and persistence.
- `packages/game-core`: deterministic game rules without rendering, networking or database dependencies.
- `packages/shared-contracts`: runtime-validated shared request/response contracts.
- `packages/ui`: reusable React UI primitives.
- `database`: migration output and database documentation.
- `tests`: end-to-end browser tests.
- `infrastructure`: local and deployment infrastructure documentation.

## Supabase Auth

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to configure the browser auth client in the authentication milestone. Never expose a Supabase service-role key in browser code.

## Mobile packaging

The web app includes a PWA manifest and service worker. Capacitor configuration is included for native packaging. Native iOS builds require Apple's signing/build environment; the PWA is the computer-free distribution path.

## Step 01 scope

This step establishes the monorepo, toolchain, service dependencies, health/readiness checks, and a minimal Phaser-rendered shell. Full game turns, dice rules, matchmaking, authentication flows and Colyseus room behavior are later milestones and are not claimed as complete.

## License

Apache-2.0. See [LICENSE](./LICENSE).
