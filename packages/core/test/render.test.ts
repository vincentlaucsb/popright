import { describe, expect, it } from "vitest";
import { getItemClassName, getRenderableItemState } from "../src/render.js";
import type { ContextMenuOptions, MenuItem } from "../src/types.js";

describe("menu rendering helpers", () => {
  it("composes item classes from defaults, menu options, and item overrides", () => {
    const options: Pick<ContextMenuOptions, "classes"> = {
      classes: {
        item: "menu-item",
        itemDanger: "menu-danger"
      }
    };

    expect(
      getItemClassName(
        {
          id: "delete",
          label: "Delete",
          variant: "danger",
          className: "custom-item",
          classes: { item: "item-local", itemDanger: "danger-local" }
        },
        options
      )
    ).toBe("popright-item menu-item item-local popright-item-danger menu-danger danger-local custom-item");
  });

  it("describes separator, header, and label render states without selectable behavior", () => {
    const options: Pick<ContextMenuOptions, "classes"> = {
      classes: {
        header: "menu-title",
        separator: "rule",
        label: "section-label"
      }
    };

    expect(getRenderableItemState({ type: "separator" }, 0, 1, options)).toEqual({
      kind: "separator",
      className: "popright-separator rule",
      role: "separator",
      disabled: false,
      active: false
    });
    expect(
      getRenderableItemState({ type: "header", label: "Album", align: "items", className: "album-title" }, 1, 1, options)
    ).toEqual({
      kind: "header",
      className: "popright-header menu-title album-title",
      align: "items",
      disabled: false,
      active: false
    });
    expect(getRenderableItemState({ type: "label", label: "File" }, 1, 1, options)).toEqual({
      kind: "label",
      className: "popright-label section-label",
      disabled: false,
      active: false
    });
  });

  it("marks only the active selectable item as active", () => {
    const items: MenuItem[] = [
      { id: "open", label: "Open" },
      { id: "rename", label: "Rename" },
      { type: "submenu", id: "more", label: "More", items: [{ id: "info", label: "Info" }] }
    ];

    expect(getRenderableItemState(items[0], 0, 1, {})).toMatchObject({
      kind: "item",
      role: "menuitem",
      active: false
    });
    expect(getRenderableItemState(items[1], 1, 1, {})).toMatchObject({
      kind: "item",
      role: "menuitem",
      active: true
    });
    expect(getRenderableItemState(items[2], 2, 1, {})).toMatchObject({
      kind: "item",
      role: "menuitem",
      active: false
    });
  });

  it("renders disabled actions without marking them active", () => {
    expect(getRenderableItemState({ id: "locked", label: "Locked", disabled: true }, 0, 0, {})).toEqual({
      kind: "item",
      className: "popright-item popright-item-disabled",
      role: "menuitem",
      disabled: true,
      active: false
    });
  });
});
