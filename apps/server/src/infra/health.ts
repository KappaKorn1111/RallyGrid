import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { Redis } from "ioredis";

export function registerHealthRoutes(app: FastifyInstance, dependencies: { postgres: Pool; redis: Redis }) {
  app.get("/health", async () => ({ status: "ok", service: "rallygrid-api" }));
  app.get("/ready", async (_request, reply) => {
    const checks = await Promise.allSettled([
      dependencies.postgres.query("SELECT 1"),
      dependencies.redis.ping()
    ]);
    const postgres = checks[0]?.status === "fulfilled";
    const redis = checks[1]?.status === "fulfilled";
    const ready = postgres && redis;
    if (!ready) reply.code(503);
    return { status: ready ? "ready" : "not_ready", checks: { postgres, redis } };
  });
}
