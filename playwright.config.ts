import { defineConfig, devices } from "@playwright/test";

const visualPort = Number(process.env.POPRIGHT_VISUAL_PORT ?? 4174);
const baseURL = `http://127.0.0.1:${visualPort}`;
const node = JSON.stringify(process.execPath);

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
    colorScheme: "light",
    viewport: {
      width: 1280,
      height: 720
    },
    trace: "on-first-retry"
  },
  webServer: {
    command: `${node} scripts/build.mjs && ${node} scripts/build-demo.mjs && ${node} scripts/serve-demo.mjs`,
    env: {
      PORT: String(visualPort)
    },
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
