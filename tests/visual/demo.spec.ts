import { expect, type Page, test } from "@playwright/test";

async function gotoDemo(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Metallica Right-Click Jukebox" })).toBeVisible();
  await expect(page.locator(".album-row")).toHaveCount(11);
}

function albumRow(page: Page, title: string) {
  return page.locator(".album-row").filter({ has: page.locator(".album-title", { hasText: title }) });
}

test("demo page light theme", async ({ page }) => {
  await gotoDemo(page);

  await expect(page).toHaveScreenshot("demo-page-light.png", {
    fullPage: true
  });
});

test("demo page dark theme", async ({ page }) => {
  await gotoDemo(page);
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await expect(page).toHaveScreenshot("demo-page-dark.png", {
    fullPage: true
  });
});

test("context menu opened from album right click", async ({ page }) => {
  await gotoDemo(page);
  await albumRow(page, "Ride the Lightning").click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /For Whom the Bell Tolls/ })).toBeVisible();

  await expect(menu).toHaveScreenshot("album-context-menu.png");
});

test("context menu opened from action button", async ({ page }) => {
  await gotoDemo(page);
  await albumRow(page, "St. Anger").getByRole("button", { name: "Actions" }).click();

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /Some Kind of Monster/ })).toBeVisible();

  await expect(menu).toHaveScreenshot("album-action-menu.png");
});
