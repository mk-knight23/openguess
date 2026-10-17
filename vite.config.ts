import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.DEPLOY_BASE || "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // Bound parallel JSON-pack and jsdom startup memory on local/CI runners.
    maxWorkers: 2,
  },
  build: { sourcemap: false },
});
