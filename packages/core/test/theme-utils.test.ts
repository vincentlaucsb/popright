import { describe, expect, it } from "vitest";
import { BUILT_IN_THEME } from "../src/constants.js";
import type { ContextMenuThemeStore } from "../src/types.js";
import { cloneTheme, normalizeThemeInput } from "../src/theme-utils.js";

describe("theme utilities", () => {
  it("merges theme tokens while preserving global defaults", () => {
    const theme = normalizeThemeInput({
      mode: "dark",
      classes: {
        item: "custom-item"
      },
      styles: {
        menu: {
          minWidth: "12rem"
        }
      },
      tokens: {
        bg: "#111",
        color: "#eee"
      }
    });

    expect(theme.mode).toBe("dark");
    expect(theme.tokens?.bg).toBe("#111");
    expect(theme.tokens?.color).toBe("#eee");
    expect(theme.tokens?.border).toBe(BUILT_IN_THEME.tokens.border);
    expect(theme.classes?.item).toBe("custom-item");
    expect(theme.styles?.menu?.minWidth).toBe("12rem");
  });

  it("normalizes store input against the current store value", () => {
    const storeTheme = normalizeThemeInput({
      mode: "dark",
      tokens: {
        bg: "#111"
      }
    });
    const store: ContextMenuThemeStore = {
      get: () => storeTheme,
      set: () => undefined,
      update: () => undefined,
      subscribe: () => () => undefined
    };

    expect(normalizeThemeInput(store).mode).toBe("dark");
    expect(normalizeThemeInput(store).tokens?.bg).toBe("#111");
  });

  it("clones nested theme objects", () => {
    const clone = cloneTheme(BUILT_IN_THEME);
    clone.tokens.bg = "#000";
    clone.classes.item = "changed";

    expect(BUILT_IN_THEME.tokens.bg).not.toBe("#000");
    expect(BUILT_IN_THEME.classes.item).not.toBe("changed");
  });
});
