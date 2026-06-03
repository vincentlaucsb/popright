import type {
  MenuChildItem,
  ContextMenuOptions,
  MenuActionItem,
  MenuContext,
  MenuItem,
  MenuItemsInput,
  MenuSelectableItem,
  NormalizedContextMenuOptions,
  OpenInput
} from "./types.js";

export function normalizeOptions(options: ContextMenuOptions): NormalizedContextMenuOptions {
  return {
    trigger: "contextmenu",
    placement: "cursor",
    side: "bottom",
    align: "start",
    sideOffset: 0,
    alignOffset: 0,
    strategy: "fixed",
    closeOnSelect: true,
    closeOnBlur: true,
    closeOnEscape: true,
    closeOnScroll: true,
    closeOnResize: true,
    modal: false,
    collisionPadding: 8,
    menuType: "context",
    ...options
  };
}

export function normalizeTargets(target: unknown): EventTarget[] {
  if (!target || !canUseDom()) {
    return [];
  }
  if (isEventTarget(target)) {
    return [target];
  }
  if (typeof (target as Iterable<unknown>)[Symbol.iterator] === "function") {
    return [...(target as Iterable<unknown>)].filter(isEventTarget);
  }
  return [];
}

export function isEventTarget(value: unknown): value is EventTarget {
  return (
    Boolean(value) &&
    typeof (value as EventTarget).addEventListener === "function" &&
    typeof (value as EventTarget).removeEventListener === "function"
  );
}

export function resolveItems(items: MenuItemsInput, context: MenuContext): MenuItem[] {
  if (typeof items === "function") {
    const resolved = items(context);
    if (resolved && typeof (resolved as unknown as Promise<MenuItem[]>).then === "function") {
      throw new Error("Popright does not support async item resolvers yet.");
    }
    return resolved;
  }
  return items;
}

export function normalizeItems(items: unknown): MenuItem[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item): item is MenuItem => Boolean(item) && !("hidden" in item && item.hidden));
}

export function hasSelectableOrLabelContent(items: MenuItem[]): boolean {
  return items.some((item) => item.type !== "separator");
}

export function selectableIndexes(items: MenuItem[]): number[] {
  return items.flatMap((item, index) => (isSelectable(item) ? [index] : []));
}

export function firstSelectableIndex(items: MenuItem[]): number {
  return selectableIndexes(items)[0] ?? -1;
}

export function lastSelectableIndex(items: MenuItem[]): number {
  const indexes = selectableIndexes(items);
  return indexes[indexes.length - 1] ?? -1;
}

export function isSelectable(item: MenuItem | undefined): item is MenuSelectableItem {
  return !!item && (item.type === undefined || item.type === "item" || item.type === "submenu") && !item.disabled;
}

export function isChildMenuItem(item: MenuItem): item is MenuChildItem {
  return item.type !== "submenu";
}

export function createMenuContext(input: OpenInput): MenuContext {
  return {
    triggerEvent: input.triggerEvent,
    target: input.target,
    x: input.x,
    y: input.y,
    data: input.context
  };
}

export function containsEventTarget(candidate: EventTarget, target: EventTarget | null): boolean {
  if (!target) {
    return false;
  }
  if (candidate === target) {
    return true;
  }
  return candidate instanceof Node && target instanceof Node && candidate.contains(target);
}

export function applyStyle(element: HTMLElement, style: Partial<CSSStyleDeclaration> | undefined): void {
  if (!style) {
    return;
  }
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined && value !== null) {
      element.style.setProperty(kebabCase(key), String(value));
    }
  }
}

export function composeClass(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function splitClasses(value: string): string[] {
  return String(value).split(/\s+/).filter(Boolean);
}

export function toCssValue(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function canUseDom(): boolean {
  return typeof document !== "undefined";
}
