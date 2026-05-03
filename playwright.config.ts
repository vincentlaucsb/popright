import { defineConfig, devices } from "@playwright/test";

const visualPort = Number(process.env.POPRIGHT_VISUAL_PORT ?? 4174);
const baseURL = `http://127.0.0.1:${visualPort}`;

export default defineConfig({
  testDir: "./tests/visual",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }]
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01
    }
  },
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run build && npm run build:demo && npm run serve:demo",
    env: {
      PORT: String(visualPort)
    },
    url: baseURL,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
