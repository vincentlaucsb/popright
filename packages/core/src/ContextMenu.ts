import type { MenuController } from "./MenuController.js";
import { computeMenuPosition } from "./positioning.js";
import { createMenuRoot, renderMenuItems, updateActiveDom } from "./render.js";
import { applyTheme } from "./theme.js";
import { contextMenuTheme } from "./ThemeStore.js";
import type {
  CloseReason,
  ContextMenuOptions,
  MenuContext,
  MenuItem,
  MenuSelectEvent,
  NormalizedContextMenuOptions,
  OpenInput
} from "./types.js";
import {
  applyStyle,
  canUseDom,
  containsEventTarget,
  createMenuContext,
  firstSelectableIndex,
  hasSelectableOrLabelContent,
  isChildMenuItem,
  isSelectable,
  lastSelectableIndex,
  normalizeItems,
  normalizeOptions,
  normalizeTargets,
  resolveItems,
  selectableIndexes
} from "./utils.js";

type Cleanup = () => void;

interface ContextMenuInternalOptions {
  parent?: ContextMenu;
  register?: boolean;
}

export class ContextMenu {
  readonly controller: MenuController;
  readonly targets: EventTarget[];
  options: NormalizedContextMenuOptions;
  root: HTMLElement | null = null;
  items: MenuItem[] = [];
  activeIndex = -1;
  currentContext: MenuContext | null = null;
  destroyed = false;
  registeredAt = 0;
  previousFocus: Element | null = null;
  unsubscribeTheme: Cleanup | null = null;
  targetCleanups: Cleanup[] = [];
  globalCleanups: Cleanup[] = [];
  childMenu: ContextMenu | null = null;
  readonly parent: ContextMenu | null;
  readonly registeredWithController: boolean;
  private itemsSource: unknown = null;

  constructor(controller: MenuController, target: unknown, options: ContextMenuOptions, internal: ContextMenuInternalOptions = {}) {
    this.controller = controller;
    this.targets = normalizeTargets(target);
    this.options = normalizeOptions(options);
    this.parent = internal.parent ?? null;
    this.registeredWithController = internal.register ?? true;

    if (this.registeredWithController) {
      this.controller.register(this);
    }
    this.attachTargets();
  }

  requestOpen(input: OpenInput): void {
    if (this.destroyed) {
      return;
    }
    this.controller.requestOpen(this, input);
  }

  openNow(input: OpenInput): void {
    if (this.destroyed || !canUseDom()) {
      return;
    }

    const context = createMenuContext(input);
    const before = this.options.onBeforeOpen?.({ context });
    if (before === false) {
      if (this.registeredWithController) {
        this.controller.clearActive(this);
      }
      return;
    }

    const items = normalizeItems(resolveItems(this.options.items, context));
    if (!hasSelectableOrLabelContent(items)) {
      if (this.registeredWithController) {
        this.controller.clearActive(this);
      }
      return;
    }

    this.close("reopen");
    if (this.registeredWithController) {
      this.controller.setActive(this);
    }
    this.previousFocus = document.activeElement;
    this.currentContext = context;
    this.items = items;
    this.activeIndex = firstSelectableIndex(items);

    const root = createMenuRoot({
      ownerDocument: document,
      options: this.options,
      onKeyDown: (event) => this.onKeyDown(event),
      onPointerMove: (event) => this.onPointerMove(event),
      onClick: (event) => this.onClick(event)
    });
    applyTheme(root, this.options.theme);

    renderMenuItems(root, {
      items: this.items,
      context,
      options: this.options,
      onItemEnter: (index) => {
        if (isSelectable(this.items[index])) {
          this.activeIndex = index;
          this.updateActiveDom();
          if (this.items[index]?.type === "submenu") {
            this.openSubmenu(index);
          } else {
            this.closeChild("manual");
          }
        }
      }
    });

    const portal = this.options.portal === false ? document.body : this.options.portal ?? document.body;
    const initialVisibility = root.style.visibility;
    root.style.visibility = "hidden";
    portal.append(root);
    this.positionRoot(root, input);
    root.style.visibility = initialVisibility;
    this.root = root;

    this.unsubscribeTheme = contextMenuTheme.subscribe(() => {
      if (this.root) {
        applyTheme(this.root, this.options.theme);
      }
    });

    this.attachGlobalListeners();
    root.focus({ preventScroll: true });
    this.updateActiveDom();
    this.options.onOpen?.({ context, root });
  }

  close(reason: CloseReason = "manual", nativeEvent?: Event): void {
    this.closeChild(reason, nativeEvent);
    if (!this.root) {
      if (reason === "destroy" && this.registeredWithController) {
        this.controller.clearActive(this);
      }
      return;
    }

    const root = this.root;
    this.root = null;
    this.items = [];
    this.activeIndex = -1;
    this.currentContext = null;
    this.globalCleanups.splice(0).forEach((cleanup) => cleanup());
    this.unsubscribeTheme?.();
    this.unsubscribeTheme = null;
    root.remove();

    if (this.previousFocus instanceof HTMLElement) {
      this.previousFocus.focus({ preventScroll: true });
    }
    this.previousFocus = null;
    if (this.registeredWithController) {
      this.controller.clearActive(this);
    }
    this.options.onClose?.({ reason, nativeEvent });
  }

  update(options: Partial<ContextMenuOptions>): void {
    this.options = normalizeOptions({ ...this.options, ...options });
    if (this.root) {
      applyTheme(this.root, this.options.theme);
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.close("destroy");
    this.targetCleanups.splice(0).forEach((cleanup) => cleanup());
    if (this.registeredWithController) {
      this.controller.unregister(this);
    }
  }

  containsTarget(target: EventTarget | null): boolean {
    return this.targets.some((candidate) => containsEventTarget(candidate, target));
  }

  getTargetDepth(eventTarget: EventTarget | null): number {
    if (!eventTarget) {
      return -1;
    }
    if (this.targets.length === 0) {
      return 0;
    }

    let depth = 0;
    let current: EventTarget | null = eventTarget;
    while (current) {
      if (this.targets.includes(current)) {
        return depth;
      }
      current = current instanceof Node ? current.parentNode : null;
      depth += 1;
    }
    return -1;
  }

  hasTargets(): boolean {
    return this.targets.length > 0;
  }

  positionRoot(root: HTMLElement, input: OpenInput): void {
    const ownerDocument = root.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    const documentElement = ownerDocument.documentElement;
    const viewportWidth = documentElement.clientWidth || ownerWindow?.innerWidth || 0;
    const viewportHeight = documentElement.clientHeight || ownerWindow?.innerHeight || 0;
    const padding = Math.max(0, this.options.collisionPadding);
    const availableHeight = Math.max(0, viewportHeight - padding * 2);

    let rect = root.getBoundingClientRect();
    if (rect.height > availableHeight && this.options.maxHeight === undefined) {
      root.style.maxHeight = `${availableHeight}px`;
      root.style.overflowY = "auto";
      rect = root.getBoundingClientRect();
    }

    const preferredLeft = input.x ?? 0;
    const preferredTop = input.y ?? 0;
    const position = computeMenuPosition({
      preferredLeft,
      preferredTop,
      width: rect.width,
      height: rect.height,
      viewportWidth,
      viewportHeight,
      padding,
      strategy: this.options.strategy,
      scrollX: ownerWindow?.scrollX,
      scrollY: ownerWindow?.scrollY
    });

    root.style.left = `${position.left}px`;
    root.style.top = `${position.top}px`;
  }

  get isOpen(): boolean {
    return this.root !== null;
  }

  attachTargets(): void {
    if (this.options.trigger === "manual") {
      return;
    }
    for (const target of this.targets) {
      const type = this.options.trigger;
      const listener = (event: Event) => {
        if (type === "contextmenu") {
          event.preventDefault();
        }
        const pointerEvent = event as MouseEvent;
        this.requestOpen({
          x: pointerEvent.clientX ?? 0,
          y: pointerEvent.clientY ?? 0,
          target: event.currentTarget instanceof Element ? event.currentTarget : undefined,
          triggerEvent: event
        });
      };
      target.addEventListener(type, listener);
      this.targetCleanups.push(() => target.removeEventListener(type, listener));
    }
  }

  attachGlobalListeners(): void {
    if (!this.root) {
      return;
    }
    const root = this.root;
    const ownerDocument = root.ownerDocument;
    const pointerListener = (event: PointerEvent) => {
      if (
        this.options.closeOnBlur &&
        this.root &&
        !this.root.contains(event.target as Node) &&
        !this.childMenu?.containsRoot(event.target)
      ) {
        this.close("outside-pointer", event);
      }
    };
    const blurListener = (event: FocusEvent) => {
      if (!this.options.closeOnBlur || !this.root) {
        return;
      }
      const next = event.relatedTarget;
      if (next instanceof Node && (this.root.contains(next) || this.childMenu?.containsRoot(next))) {
        return;
      }
      this.close("blur", event);
    };
    const scrollListener = (event: Event) => {
      if (this.options.closeOnScroll) {
        this.close("scroll", event);
      }
    };
    const resizeListener = (event: Event) => {
      if (this.options.closeOnResize) {
        this.close("resize", event);
      }
    };

    ownerDocument.addEventListener("pointerdown", pointerListener, true);
    root.addEventListener("focusout", blurListener);
    ownerDocument.addEventListener("scroll", scrollListener, true);
    root.ownerDocument.defaultView?.addEventListener("resize", resizeListener);

    this.globalCleanups.push(() => ownerDocument.removeEventListener("pointerdown", pointerListener, true));
    this.globalCleanups.push(() => root.removeEventListener("focusout", blurListener));
    this.globalCleanups.push(() => ownerDocument.removeEventListener("scroll", scrollListener, true));
    this.globalCleanups.push(() => root.ownerDocument.defaultView?.removeEventListener("resize", resizeListener));
  }

  onPointerMove(event: PointerEvent): void {
    const item = (event.target as Element | null)?.closest?.("[data-popright-item]");
    if (!item || !this.root?.contains(item)) {
      return;
    }
    const index = Number((item as HTMLElement).dataset.index);
    if (isSelectable(this.items[index])) {
      this.activeIndex = index;
      this.updateActiveDom();
      if (this.items[index]?.type === "submenu") {
        this.openSubmenu(index);
      } else {
        this.closeChild("manual");
      }
    }
  }

  onClick(event: MouseEvent): void {
    const item = (event.target as Element | null)?.closest?.("[data-popright-item]");
    if (!item || !this.root?.contains(item)) {
      return;
    }
    this.selectIndex(Number((item as HTMLElement).dataset.index), event);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.options.closeOnEscape) {
      event.preventDefault();
      this.close("escape", event);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.moveActive(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.moveActive(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      this.activeIndex = firstSelectableIndex(this.items);
      this.updateActiveDom();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      this.activeIndex = lastSelectableIndex(this.items);
      this.updateActiveDom();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.selectIndex(this.activeIndex, event);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.openSubmenu(this.activeIndex);
      return;
    }
    if (event.key === "ArrowLeft" && this.parent) {
      event.preventDefault();
      this.parent.closeChild("manual", event);
      this.parent.root?.focus({ preventScroll: true });
    }
  }

  moveActive(delta: number): void {
    const selectable = selectableIndexes(this.items);
    if (selectable.length === 0) {
      this.activeIndex = -1;
      this.updateActiveDom();
      return;
    }
    const currentPosition = selectable.indexOf(this.activeIndex);
    const nextPosition =
      currentPosition === -1
        ? delta > 0
          ? 0
          : selectable.length - 1
        : (currentPosition + delta + selectable.length) % selectable.length;
    this.activeIndex = selectable[nextPosition];
    this.updateActiveDom();
  }

  selectIndex(index: number, nativeEvent: Event): void {
    const item = this.items[index];
    if (!isSelectable(item)) {
      return;
    }

    if (item.type === "submenu") {
      this.openSubmenu(index);
      return;
    }

    let closePrevented = false;
    const event: MenuSelectEvent = {
      id: item.id,
      item,
      nativeEvent,
      context: this.currentContext ?? createMenuContext({ triggerEvent: nativeEvent }),
      close: () => this.close("select", nativeEvent),
      preventClose: () => {
        closePrevented = true;
      }
    };

    if ("onSelect" in item) {
      item.onSelect?.(event);
    }
    this.options.onSelect?.(event);

    if (this.parent && this.options.closeOnSelect && !closePrevented) {
      this.parent.close("select", nativeEvent);
      return;
    }

    if (this.options.closeOnSelect && !closePrevented) {
      this.close("select", nativeEvent);
    }
  }

  updateActiveDom(): void {
    if (!this.root) {
      return;
    }
    updateActiveDom(this.root, this.items, this.activeIndex, this.options);
  }

  containsRoot(target: EventTarget | null): boolean {
    return (
      !!this.root &&
      target instanceof Node &&
      (this.root.contains(target) || Boolean(this.childMenu?.containsRoot(target)))
    );
  }

  openSubmenu(index: number): void {
    if (!this.root || !canUseDom()) {
      return;
    }
    const item = this.items[index];
    if (!item || item.type !== "submenu" || item.disabled) {
      return;
    }

    const trigger = this.root.querySelector<HTMLElement>(`[data-popright-item][data-index="${index}"]`);
    if (!trigger) {
      return;
    }
    if (this.childMenu?.itemsSource === item.items) {
      return;
    }

    this.closeChild("manual");
    const childItems = normalizeItems(resolveItems(item.items, this.currentContext ?? createMenuContext({}))).filter(
      isChildMenuItem
    );
    if (!hasSelectableOrLabelContent(childItems)) {
      return;
    }

    const childMenu = new ContextMenu(
      this.controller,
      null,
      {
        ...this.options,
        trigger: "manual",
        items: childItems,
        onBeforeOpen: undefined,
        onOpen: undefined,
        onClose: undefined,
        onSelect: (event) => this.options.onSelect?.(event)
      },
      { parent: this, register: false }
    );
    childMenu.itemsSource = item.items;
    this.childMenu = childMenu;

    const rect = trigger.getBoundingClientRect();
    childMenu.openNow({
      x: rect.right,
      y: rect.top,
      target: trigger,
      triggerEvent: this.currentContext?.triggerEvent,
      context: this.currentContext?.data
    });
    trigger.setAttribute("aria-expanded", String(childMenu.isOpen));
    if (childMenu.root) {
      childMenu.root.dataset.poprightSubmenu = "";
      childMenu.root.classList.add(this.options.classes?.submenu ?? "popright-submenu");
      childMenu.root.focus({ preventScroll: true });
    }
  }

  closeChild(reason: CloseReason = "manual", nativeEvent?: Event): void {
    const child = this.childMenu;
    if (!child) {
      return;
    }
    this.childMenu = null;
    child.destroy();
    const trigger = this.root?.querySelector<HTMLElement>("[data-popright-submenu-trigger][aria-expanded='true']");
    trigger?.setAttribute("aria-expanded", "false");
  }
}
