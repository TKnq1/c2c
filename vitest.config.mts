import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    server: {
      // next-auth imports "next/server" without a file extension, which Node's own ESM loader
      // refuses. Inlined, Vite resolves it like the app's bundler does.
      deps: { inline: [/next-auth/] },
    },
  },
});
