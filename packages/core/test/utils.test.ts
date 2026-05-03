import { describe, expect, it } from "vitest";
import type { MenuItem } from "../src/types.js";
import {
  createMenuContext,
  firstSelectableIndex,
  hasSelectableOrLabelContent,
  isSelectable,
  lastSelectableIndex,
  normalizeItems,
  resolveItems,
  selectableIndexes
} from "../src/utils.js";

describe("menu item utilities", () => {
  it("filters hidden and invalid items during normalization", () => {
    const visible = { id: "open", label: "Open" };
    const normalized = normalizeItems([
      null,
      visible,
      { id: "hidden", label: "Hidden", hidden: true },
      { type: "separator", hidden: true },
      { type: "header", label: "Album" },
      { type: "label", label: "More" }
    ]);

    expect(normalized).toEqual([visible, { type: "header", label: "Album" }, { type: "label", label: "More" }]);
    expect(normalizeItems(undefined)).toEqual([]);
  });

  it("treats empty and separator-only menus as lacking content", () => {
    expect(hasSelectableOrLabelContent([])).toBe(false);
    expect(hasSelectableOrLabelContent([{ type: "separator" }])).toBe(false);
    expect(hasSelectableOrLabelContent([{ type: "header", label: "Album" }])).toBe(true);
    expect(hasSelectableOrLabelContent([{ type: "label", label: "Group" }])).toBe(true);
    expect(hasSelectableOrLabelContent([{ id: "open", label: "Open" }])).toBe(true);
  });

  it("excludes disabled items, labels, and separators from selectable indexes", () => {
    const items: MenuItem[] = [
      { type: "header", label: "Album" },
      { type: "label", label: "File" },
      { id: "disabled", label: "Disabled", disabled: true },
      { type: "separator" },
      { id: "open", label: "Open" },
      { id: "delete", label: "Delete", variant: "danger" },
      { type: "submenu", id: "more", label: "More", items: [{ id: "info", label: "Info" }] }
    ];

    expect(isSelectable(items[0])).toBe(false);
    expect(isSelectable(items[1])).toBe(false);
    expect(selectableIndexes(items)).toEqual([4, 5, 6]);
    expect(firstSelectableIndex(items)).toBe(4);
    expect(lastSelectableIndex(items)).toBe(6);
  });

  it("throws clearly for async item resolvers", () => {
    expect(() =>
      resolveItems(() => Promise.resolve([{ id: "open", label: "Open" }]) as never, createMenuContext({}))
    ).toThrow("Popright does not support async item resolvers yet.");
  });
});
