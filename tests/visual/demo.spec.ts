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

async function expectInsideViewport(page: Page, selector = "[data-popright-menu]"): Promise<void> {
  const box = await page.locator(selector).last().boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
}

async function createCollisionFixture(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <button id="bottom-dropdown" style="position: fixed; right: 8px; bottom: 8px;">Bottom dropdown</button>
        <button id="right-submenu" style="position: fixed; right: 8px; top: 140px;">Right submenu</button>
        <button id="rtl-align" style="position: fixed; right: 8px; top: 220px;" dir="rtl">RTL align</button>
        <button id="scroll-target" style="position: absolute; z-index: 1; left: 140px; top: 1350px;">Scroll target</button>
        <div style="height: 1800px;"></div>
      `
    );

    const api = window as unknown as {
      __poprightCreateContextMenu: typeof import("../../packages/core/src/index.js").createContextMenu;
      __poprightCreateDropdownMenu: typeof import("../../packages/core/src/index.js").createDropdownMenu;
    };

    api.__poprightCreateDropdownMenu(document.querySelector("#bottom-dropdown")!, {
      items: [
        { id: "one", label: "One" },
        { id: "two", label: "Two" },
        { id: "three", label: "Three" }
      ]
    });

    api.__poprightCreateDropdownMenu(document.querySelector("#right-submenu")!, {
      items: [
        {
          type: "submenu",
          id: "more",
          label: "More",
          items: [
            { id: "details", label: "Details" },
            { id: "source", label: "Source" }
          ]
        }
      ]
    });

    api.__poprightCreateDropdownMenu(document.querySelector("#rtl-align")!, {
      dir: "rtl",
      align: "start",
      items: [{ id: "rtl-one", label: "RTL One" }]
    });

    api.__poprightCreateContextMenu(document.querySelector("#scroll-target")!, {
      items: [{ id: "scrolled", label: "Scrolled" }]
    });
  });
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

test("bottom-right context menu stays inside the viewport", async ({ page }) => {
  await gotoDemo(page);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  await page.evaluate(({ x, y }) => {
    const api = window as unknown as {
      __poprightCreateContextMenu: typeof import("../../packages/core/src/index.js").createContextMenu;
    };
    api.__poprightCreateContextMenu({
      items: [
        { id: "alpha", label: "Alpha" },
        { id: "beta", label: "Beta" }
      ]
    }).open({ x, y });
  }, { x: viewport!.width - 2, y: viewport!.height - 2 });

  await expectInsideViewport(page);
});

test("bottom-edge dropdown stays inside the viewport", async ({ page }) => {
  await gotoDemo(page);
  await createCollisionFixture(page);

  await page.locator("#bottom-dropdown").click();

  await expectInsideViewport(page);
});

test("right-edge submenu stays inside the viewport", async ({ page }) => {
  await gotoDemo(page);
  await createCollisionFixture(page);

  await page.locator("#right-submenu").click();
  await page.getByRole("menuitem", { name: "More" }).dispatchEvent("pointermove", {
    bubbles: true,
    pointerType: "mouse"
  });

  await expect(page.getByRole("menu")).toHaveCount(2);
  await expectInsideViewport(page);
});

test("long menu gets max height and scrolls instead of overflowing", async ({ page }) => {
  await gotoDemo(page);

  await page.evaluate(() => {
    const api = window as unknown as {
      __poprightCreateContextMenu: typeof import("../../packages/core/src/index.js").createContextMenu;
    };
    api.__poprightCreateContextMenu({
      items: Array.from({ length: 60 }, (_, index) => ({ id: `item-${index}`, label: `Item ${index}` }))
    }).open({ x: window.innerWidth - 4, y: window.innerHeight - 4 });
  });

  await expectInsideViewport(page);
  await expect(page.locator("[data-popright-menu]")).toHaveJSProperty("scrollTop", 0);
  const scrolls = await page.locator("[data-popright-menu]").evaluate((menu) => menu.scrollHeight > menu.clientHeight);
  expect(scrolls).toBe(true);
});

test("scrolled page context menu opens at the visual click position", async ({ page }) => {
  await gotoDemo(page);
  await createCollisionFixture(page);
  await page.locator("#scroll-target").scrollIntoViewIfNeeded();

  const targetBox = await page.locator("#scroll-target").boundingBox();
  expect(targetBox).not.toBeNull();
  const clickPoint = { x: Math.round(targetBox!.x + 16), y: Math.round(targetBox!.y + 8) };
  await page.locator("#scroll-target").click({ button: "right", position: { x: 16, y: 8 } });

  const menuBox = await page.locator("[data-popright-menu]").boundingBox();
  expect(menuBox).not.toBeNull();
  expect(Math.abs(menuBox!.x - clickPoint.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(menuBox!.y - clickPoint.y)).toBeLessThanOrEqual(2);
  await expectInsideViewport(page);
});

test("rtl dropdown start alignment stays inside the viewport", async ({ page }) => {
  await gotoDemo(page);
  await createCollisionFixture(page);

  const triggerBox = await page.locator("#rtl-align").boundingBox();
  expect(triggerBox).not.toBeNull();
  await page.locator("#rtl-align").click();

  const menuBox = await page.locator("[data-popright-menu]").boundingBox();
  expect(menuBox).not.toBeNull();
  expect(Math.abs(menuBox!.x + menuBox!.width - (triggerBox!.x + triggerBox!.width))).toBeLessThanOrEqual(2);
  await expectInsideViewport(page);
});
