import { ContextMenu } from "./ContextMenu.js";
import { DropdownMenu } from "./DropdownMenu.js";
import { MenuController } from "./MenuController.js";
import { contextMenuTheme } from "./ThemeStore.js";
import type { CloseReason, ContextMenuInstance, ContextMenuOptions, DropdownMenuOptions, OpenInput } from "./types.js";

const defaultController = new MenuController();

export function createContextMenu(
  target: Element | Document | Window | Iterable<Element>,
  options: ContextMenuOptions
): ContextMenuInstance;

export function createContextMenu(options: ContextMenuOptions): ContextMenuInstance;

export function createContextMenu(
  targetOrOptions: ContextMenuOptions | Element | Document | Window | Iterable<Element>,
  maybeOptions?: ContextMenuOptions
): ContextMenuInstance {
  const hasTarget = maybeOptions !== undefined;
  const target = hasTarget ? targetOrOptions : null;
  const options = hasTarget ? maybeOptions : (targetOrOptions as ContextMenuOptions);
  const menu = new ContextMenu(defaultController, target, options);

  return {
    open(input: OpenInput = {}) {
      menu.requestOpen(input);
    },
    close(reason: CloseReason = "manual") {
      menu.close(reason);
    },
    update(options: Partial<ContextMenuOptions>) {
      menu.update(options);
    },
    destroy() {
      menu.destroy();
    },
    get isOpen() {
      return menu.isOpen;
    },
    get root() {
      return menu.root;
    }
  };
}

export function createDropdownMenu(
  target: Element | Document | Window | Iterable<Element>,
  options: DropdownMenuOptions
): ContextMenuInstance;

export function createDropdownMenu(options: DropdownMenuOptions): ContextMenuInstance;

export function createDropdownMenu(
  targetOrOptions: DropdownMenuOptions | Element | Document | Window | Iterable<Element>,
  maybeOptions?: DropdownMenuOptions
): ContextMenuInstance {
  const hasTarget = maybeOptions !== undefined;
  const target = hasTarget ? targetOrOptions : null;
  const options = hasTarget ? maybeOptions : (targetOrOptions as DropdownMenuOptions);
  const menu = new DropdownMenu(defaultController, target, options);

  return {
    open(input: OpenInput = {}) {
      menu.requestOpen(input);
    },
    close(reason: CloseReason = "manual") {
      menu.close(reason);
    },
    update(options: Partial<DropdownMenuOptions>) {
      menu.update(options);
    },
    destroy() {
      menu.destroy();
    },
    get isOpen() {
      return menu.isOpen;
    },
    get root() {
      return menu.root;
    }
  };
}

export function __getDefaultControllerForTests(): MenuController {
  return defaultController;
}

export { contextMenuTheme };
export type * from "./types.js";
