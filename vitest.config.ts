import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "threads",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"]
  }
});
