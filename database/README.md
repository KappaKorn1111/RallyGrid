# Database

PostgreSQL schema definitions live in `apps/server/src/db/schema.ts`. Drizzle Kit writes generated migrations to `database/migrations`.

Run `pnpm db:generate` after schema changes and `pnpm db:migrate` to apply migrations. Never commit credentials.
