import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@rallygrid/game-core": fileURLToPath(new URL("../../packages/game-core/src/index.ts", import.meta.url)),
      "@rallygrid/shared-contracts": fileURLToPath(new URL("../../packages/shared-contracts/src/index.ts", import.meta.url)),
      "@rallygrid/ui": fileURLToPath(new URL("../../packages/ui/src/index.tsx", import.meta.url))
    }
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
  server: { host: "0.0.0.0", port: 5173 },
  build: { outDir: fileURLToPath(new URL("./dist", import.meta.url)), emptyOutDir: true }
});
