import { ContextMenu } from "./ContextMenu.js";
import type { MenuController } from "./MenuController.js";
import type { DropdownMenuOptions } from "./types.js";
import { normalizeOptions } from "./utils.js";

/**
 * Dropdown menus share the same runtime as context menus. The only difference
 * is the activation/anchoring preset: click a target and position from its box.
 */
export class DropdownMenu extends ContextMenu {
  constructor(controller: MenuController, target: unknown, options: DropdownMenuOptions) {
    super(controller, target, {
      trigger: "click",
      placement: "target",
      side: "bottom",
      align: "start",
      menuType: "dropdown",
      ...options
    });
  }
}

export function normalizeDropdownOptions(options: DropdownMenuOptions) {
  return normalizeOptions({
    trigger: "click",
    placement: "target",
    side: "bottom",
    align: "start",
    menuType: "dropdown",
    ...options
  });
}
