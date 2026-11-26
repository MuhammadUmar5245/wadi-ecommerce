import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a production build (`npm run build` first).
 * The tests share one SQLite database, so they run serially.
 * Browser: Playwright's Chromium (`npx playwright install chromium`), or set
 * PW_CHANNEL=msedge / chrome to use an installed browser instead.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PW_CHANNEL || undefined,
    viewport: { width: 1440, height: 900 },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000/en",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
