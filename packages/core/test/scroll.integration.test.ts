// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createDropdownMenu, type ContextMenuInstance } from "../src/index.js";

const menus: ContextMenuInstance[] = [];
afterEach(() => {
  menus.splice(0).forEach(menu => menu.destroy());
  document.body.replaceChildren();
});

describe("menu scroll ownership", () => {
  it("preserves root and nested content scrolling but dismisses outside scrolling", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const menu = createDropdownMenu(trigger, { items: [{ id: "open", label: "Open" }] });
    menus.push(menu);
    menu.open({ target: trigger });
    const root = menu.root!;
    root.dispatchEvent(new Event("scroll"));
    expect(menu.root).toBe(root);
    const scroller = document.createElement("div");
    root.append(scroller);
    scroller.dispatchEvent(new Event("scroll"));
    expect(menu.root).toBe(root);
    trigger.dispatchEvent(new Event("scroll"));
    expect(menu.isOpen).toBe(false);
    expect(root.isConnected).toBe(false);
  });

  it("preserves scrolling in a portaled submenu and closes the branch on page scroll", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const menu = createDropdownMenu(trigger, {
      items: [{ type: "submenu", id: "more", label: "More", items: [{ id: "child", label: "Child" }] }]
    });
    menus.push(menu);
    menu.open({ target: trigger });
    const root = menu.root!;
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    const child = document.querySelector<HTMLElement>("[data-popright-submenu]")!;
    expect(child).not.toBeNull();
    expect(root.contains(child)).toBe(false);
    child.dispatchEvent(new Event("scroll"));
    expect(menu.isOpen).toBe(true);
    expect(child.isConnected).toBe(true);
    // Parent scrolling moves the submenu anchor. Its closed child must remain reopenable.
    root.dispatchEvent(new Event("scroll"));
    expect(menu.isOpen).toBe(true);
    expect(child.isConnected).toBe(false);
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    const reopenedChild = document.querySelector<HTMLElement>("[data-popright-submenu]")!;
    expect(reopenedChild).not.toBeNull();
    expect(reopenedChild.isConnected).toBe(true);
    document.dispatchEvent(new Event("scroll"));
    expect(menu.isOpen).toBe(false);
    expect(reopenedChild.isConnected).toBe(false);
  });
});
