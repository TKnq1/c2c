import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

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
    projects: [
      {
        extends: true,
        test: { name: "unit", exclude: [...configDefaults.exclude, "**/*.integration.test.ts"] },
      },
      {
        // These share one real database (DEAL_TEST_DATABASE_URL) and the daily job looks at every deal in it, so the files
        // run one after the other. Without the variable they are skipped.
        extends: true,
        test: { name: "integration", include: ["**/*.integration.test.ts"], fileParallelism: false },
      },
    ],
  },
});
