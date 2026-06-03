// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { __getDefaultControllerForTests, createContextMenu, createDropdownMenu } from "../src/index.js";

describe("DropdownMenu", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("opens from a click trigger and anchors to the target", async () => {
    const button = document.createElement("button");
    document.body.append(button);
    button.getBoundingClientRect = () =>
      ({ left: 20, top: 30, right: 120, bottom: 60, width: 100, height: 30 } as DOMRect);

    const menu = createDropdownMenu(button, {
      items: [{ id: "new", label: "New" }]
    });

    button.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 1, clientY: 2 }));
    await Promise.resolve();

    expect(menu.isOpen).toBe(true);
    expect(menu.root?.dataset.poprightMenuType).toBe("dropdown");
    expect(menu.root?.style.top).toBe("60px");
    expect(menu.root?.style.left).toBe("20px");

    menu.destroy();
  });

  it("shares one active root menu with context menus", async () => {
    const button = document.createElement("button");
    const row = document.createElement("div");
    document.body.append(button, row);

    const dropdown = createDropdownMenu(button, {
      items: [{ id: "new", label: "New" }]
    });
    const context = createContextMenu(row, {
      items: [{ id: "edit", label: "Edit" }]
    });

    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
    expect(dropdown.isOpen).toBe(true);

    row.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    await Promise.resolve();
    expect(dropdown.isOpen).toBe(false);
    expect(context.isOpen).toBe(true);
    expect(__getDefaultControllerForTests().activeMenu?.root).toBe(context.root);
    dropdown.destroy();
    context.destroy();
  });

  it("marks automatic theme and respects RTL direction", async () => {
    const button = document.createElement("button");
    document.body.append(button);
    const menu = createDropdownMenu(button, {
      dir: "rtl",
      theme: "automatic",
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

    expect(menu.root?.dir).toBe("rtl");
    expect(menu.root?.dataset.poprightTheme).toBe("automatic");
    expect(menu.root?.querySelector("[data-popright-submenu-arrow]")?.textContent).toBe("‹");

    menu.destroy();
  });
});
