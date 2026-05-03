import { describe, expect, it } from "vitest";
import {
  __getDefaultControllerForTests,
  contextMenuTheme,
  createContextMenu
} from "../src/index.js";

describe("createContextMenu", () => {
  it("returns a stable public handle without a DOM", () => {
    const menu = createContextMenu({
      items: [{ id: "open", label: "Open" }]
    });

    expect(menu.isOpen).toBe(false);
    expect(menu.root).toBeNull();
    expect(menu.open).toEqual(expect.any(Function));
    expect(menu.close).toEqual(expect.any(Function));
    expect(menu.update).toEqual(expect.any(Function));
    expect(menu.destroy).toEqual(expect.any(Function));

    menu.open({ x: 10, y: 20 });
    expect(menu.isOpen).toBe(false);

    menu.destroy();
    menu.destroy();
  });

  it("update swaps callbacks and options without recreating the instance", () => {
    const firstSelect = () => undefined;
    const secondSelect = () => undefined;
    const menu = createContextMenu({
      items: [{ id: "open", label: "Open" }],
      onSelect: firstSelect
    });

    menu.update({
      closeOnSelect: false,
      onSelect: secondSelect
    });

    expect(menu.open).toBe(menu.open);
    expect(menu.close).toBe(menu.close);
    expect(menu.update).toBe(menu.update);
    expect(menu.destroy).toBe(menu.destroy);

    menu.destroy();
  });
});

describe("theme store", () => {
  it("supports get, set, update, and unsubscribe", () => {
    const seen: string[] = [];
    const unsubscribe = contextMenuTheme.subscribe((theme) => seen.push(theme.mode));

    contextMenuTheme.set("dark");
    contextMenuTheme.update((theme) => ({
      ...theme,
      mode: "light",
      tokens: {
        ...theme.tokens,
        bg: "#fff"
      }
    }));
    unsubscribe();
    contextMenuTheme.set("system");

    expect(seen.slice(-3)).toEqual(["system", "dark", "light"]);
    expect(contextMenuTheme.get().mode).toBe("system");
  });
});

describe("default controller", () => {
  it("exposes only one active menu slot", () => {
    const controller = __getDefaultControllerForTests();
    expect(controller.activeMenu).toBeNull();
  });
});
