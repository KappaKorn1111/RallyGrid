# Infrastructure

Local development dependencies are defined in the root `docker-compose.yml`: PostgreSQL 17 and Redis 7. Run `pnpm infra:up` and verify readiness through the API `/ready` endpoint.
