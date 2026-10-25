import { DEFAULT_CLASSES } from "../constants.js";
import type { MenuItem, NormalizedContextMenuOptions } from "../types.js";
import { applyStyle, splitClasses, toCssValue, composeClass, isSelectable } from "../utils.js";
import type { MenuRootOptions } from "./types.js";

// Caller item IDs may repeat. Resolve DOM identity in the actual portal tree after attachment.
let nextItemId = 0;

/** Creates the DOM root that owns keyboard, pointer, and click delegation. */
export function createMenuRoot({
  ownerDocument,
  options,
  onKeyDown,
  onPointerMove,
  onClick
}: MenuRootOptions): HTMLElement {
  const root = ownerDocument.createElement("div");
  if (options.id) {
    root.id = options.id;
  }
  root.className = composeClass(DEFAULT_CLASSES.menu, options.className);
  root.dataset.poprightMenu = "";
  root.dataset.poprightMenuType = options.menuType;
  root.setAttribute("role", "menu");
  root.tabIndex = -1;
  root.dir = (options.dir ?? ownerDocument.dir) || "ltr";
  root.style.position = options.strategy;
  root.style.left = "0px";
  root.style.top = "0px";
  if (options.minWidth !== undefined) {
    root.style.minWidth = toCssValue(options.minWidth);
  }
  if (options.maxHeight !== undefined) {
    root.style.maxHeight = toCssValue(options.maxHeight);
    root.style.overflowY = "auto";
  }
  if (options.zIndex !== undefined) {
    root.style.zIndex = String(options.zIndex);
  }
  applyStyle(root, options.styles?.menu);

  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("click", onClick);

  return root;
}

export function updateActiveDom(
  root: HTMLElement,
  items: MenuItem[],
  activeIndex: number,
  options: NormalizedContextMenuOptions
): void {
  const elements = root.querySelectorAll<HTMLElement>("[data-popright-item]");
  // Focus stays on the menu root; expose the same active row to accessibility APIs.
  root.removeAttribute("aria-activedescendant");
  for (const element of Array.from(elements)) {
    if (!element.id) {
      const scope = root.getRootNode() as ParentNode;
      const scopeId = "id" in scope ? scope.id : undefined;
      let id: string;
      do { id = `popright-item-${++nextItemId}`; }
      while (id === scopeId || scope.querySelector(`[id="${id}"]`));
      element.id = id;
    }
    const index = Number(element.dataset.index);
    const active = index === activeIndex && isSelectable(items[index]);
    if (active) root.setAttribute("aria-activedescendant", element.id);
    element.toggleAttribute("data-active", active);
    element.classList.toggle(DEFAULT_CLASSES.itemActive, active);
    if (options.classes?.itemActive) {
      for (const className of splitClasses(options.classes.itemActive)) {
        element.classList.toggle(className, active);
      }
    }
  }
}
