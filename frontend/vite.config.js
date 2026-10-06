import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: { "/api": "http://localhost:5000" }
  },
  build: {
    outDir: path.resolve(frontendRoot, "../dist"),
    emptyOutDir: true
  }
});
