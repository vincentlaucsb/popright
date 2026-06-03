import type { ContextMenuClassNames, ContextMenuTheme } from "./types.js";

export const DEFAULT_CLASSES: Required<ContextMenuClassNames> = {
  menu: "popright-menu",
  item: "popright-item",
  itemActive: "popright-item-active",
  itemDisabled: "popright-item-disabled",
  itemDanger: "popright-item-danger",
  separator: "popright-separator",
  header: "popright-header",
  label: "popright-label",
  icon: "popright-icon",
  shortcut: "popright-shortcut",
  submenu: "popright-submenu",
  submenuTrigger: "popright-submenu-trigger"
};

export const BUILT_IN_THEME: ContextMenuTheme = {
  mode: "automatic",
  classes: DEFAULT_CLASSES,
  tokens: {}
};
