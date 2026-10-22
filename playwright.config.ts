
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",

  testMatch: "**/*.spec.ts",

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  fullyParallel: false,

  workers: 1,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
