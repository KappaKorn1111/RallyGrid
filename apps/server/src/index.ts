import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { Pool } from "pg";
import Redis from "ioredis";
import { Server as ColyseusServer } from "colyseus";
import { env } from "./config/env.js";
import { registerHealthRoutes } from "./infra/health.js";

const app = Fastify({ logger: { level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie"] } });
const postgres = new Pool({ connectionString: env.DATABASE_URL, max: 10, connectionTimeoutMillis: 3000 });
const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 3000 });

await app.register(helmet);
await app.register(cors, { origin: env.CORS_ORIGIN.split(",").map((value) => value.trim()) });
registerHealthRoutes(app, { postgres, redis });
app.get("/", async () => ({ name: "RALLYGRID API", version: "0.1.0", health: "/health", readiness: "/ready" }));

let colyseus: ColyseusServer | undefined;
async function shutdown() {
  if (colyseus) await colyseus.gracefullyShutdown(false).catch(() => undefined);
  await app.close().catch(() => undefined);
  if (redis.status !== "end") await redis.quit().catch(() => undefined);
  await postgres.end().catch(() => undefined);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

try {
  await redis.connect();
  await postgres.query("SELECT 1");
  colyseus = new ColyseusServer({ server: app.server });
  await app.listen({ host: env.HOST, port: env.PORT });
  app.log.info({ port: env.PORT }, "RALLYGRID API listening");
} catch (error) {
  app.log.error(error, "Startup failed: infrastructure dependencies must be available");
  await shutdown();
  process.exitCode = 1;
}
