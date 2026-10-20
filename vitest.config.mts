import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: [
            "**/tests/unit/**/*.test.ts",
            "**/tests/unit/**/*.test.tsx",
          ],
          exclude: [
            "**/node_modules/**",
            "**/.next/**",
          ],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: [
            "**/tests/integration/**/*.test.ts",
            "**/tests/integration/**/*.test.tsx",
          ],
          exclude: [
            "**/node_modules/**",
            "**/.next/**",
          ],
        },
      },
    ],
  },
});