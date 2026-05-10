import { expect, type Page, test } from "@playwright/test";

async function gotoDemo(page: Page): Promise<void> {
  await page.goto("/");
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        font-family: Arial, "Liberation Sans", sans-serif !important;
        font-variant-ligatures: none !important;
        text-rendering: geometricPrecision !important;
      }
    `
  });
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

test("page context menu opened from right click", async ({ page }) => {
  await gotoDemo(page);
  await page.getByRole("heading", { name: "Metallica Right-Click Jukebox" }).click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "View Source" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Light" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Dark" })).toBeVisible();

  await expect(menu).toHaveScreenshot("page-context-menu.png");
});

test("context menu opened from action button", async ({ page }) => {
  await gotoDemo(page);
  await albumRow(page, "St. Anger").getByRole("button", { name: "Actions" }).click();

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /Some Kind of Monster/ })).toBeVisible();

  await expect(menu).toHaveScreenshot("album-action-menu.png");
});

test("rtl dropdown uses mirrored submenu affordance", async ({ page }) => {
  await gotoDemo(page);
  await page.evaluate(async () => {
    const button = document.createElement("button");
    button.textContent = "RTL dropdown";
    button.id = "rtl-dropdown-test";
    document.body.append(button);
    const createDropdownMenu = (window as unknown as {
      __poprightCreateDropdownMenu: typeof import("../../packages/core/src/index.js").createDropdownMenu;
    }).__poprightCreateDropdownMenu;
    createDropdownMenu(button, {
      dir: "rtl",
      items: [
        {
          type: "submenu",
          id: "more",
          label: "More",
          items: [{ id: "details", label: "Details" }]
        }
      ]
    });
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
  const menu = page.getByRole("menu");
  await expect(menu).toHaveAttribute("dir", "rtl");
  await expect(menu.locator("[data-popright-submenu-arrow]")).toHaveText("‹");
});
