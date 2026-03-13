import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }
      ]
    }
  },
  {
    files: ["src/lib/spotify/client.ts"],
    rules: {
      // Spotify payloads are dynamically shaped; this file progressively normalizes them.
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  globalIgnores([
    ".next/**",
    ".next.bak*/**",
    ".netlify/**",
    "node_modules/**",
    "prisma/migrations/**"
  ])
]);
