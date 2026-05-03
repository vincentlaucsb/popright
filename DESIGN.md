# Popright Design Document

## Summary

Popright is a modern, data-driven context menu library for the web. It starts with a vanilla JavaScript/TypeScript core and exposes thin framework adapters, beginning with React.

The goal is not to compete with full UI systems like shadcn, Bits UI, Radix, Zag, or Ark UI on breadth. The goal is to own a narrower and very common application workflow:

> Given some dynamic state, describe the menu as data and get a context menu that behaves correctly in production.

Most real application context menus are generated from state: a selected file, a table row, a graph node, a canvas item, a text selection, a dashboard widget, or an editor region. Component-composition APIs are powerful, but they can become verbose when the menu shape is dynamic. Popright should make that path feel natural while still handling the hard browser details: ARIA roles, focus, keyboard navigation, disabled items, nested menus, viewport collision, scroll constraints, and cleanup.

## Design Thesis

Popright sits between two existing categories:

1. Tiny vanilla context menu packages that are easy to use but often under-specified for accessibility, overflow, nested interactions, and long-term maintenance.
2. Robust headless UI primitives that handle behavior well but require users to build menu structure in markup, which is awkward for dynamic menus.

Popright should feel closer to `ctxmenu` or the original `svelte-contextmenu` ergonomically, but closer to Bits/Zag in behavioral seriousness.

The product sentence:

> Popright is a tiny, typed, data-driven context menu primitive for modern web apps.

The practical promise:

> Pass menu items as data. Popright handles right-click, positioning, ARIA, keyboard navigation, and cleanup.

## Non-Goals

Popright should avoid becoming a general UI library.

It should not include:

- Dialogs, popovers, selects, dropdown menus, toasts, or unrelated primitives.
- A large theme system.
- Required CSS frameworks.
- Required icons.
- Framework-specific logic in the core.
- A markup-first API as the primary design center.
- A dependency on a large positioning or UI system unless the tradeoff is clearly worth it.

Popright may eventually share internal primitives with other packages, but the public project should stay focused on context menus.

## Package Shape

Popright should use a scoped multi-package architecture from the beginning. The core value of the project is framework-agnostic behavior, and the React adapter has a concrete downstream use case in the resume builder. A monorepo makes that separation explicit instead of treating adapters as incidental subpaths.

Initial packages:

```text
@popright/core
@popright/react
```

This is the final package direction for the initial implementation.

Svelte integration should not be the first Popright adapter because the existing `svelte-contextmenu` package still has meaningful usage and search presence. Rather than replacing it immediately, Popright can treat `svelte-contextmenu` as the proven Svelte-facing package while the new Popright work focuses on a framework-agnostic core and a React adapter.

Possible future package:

```text
@popright/svelte
```

This should only exist if there is a clear reason to migrate, wrap, or modernize the existing Svelte package rather than simply continuing to maintain `svelte-contextmenu`.

The initial workspace should be shaped as a small monorepo:

```text
packages/
  core/
  react/
examples/
  vanilla/
  react/
```

This keeps the core honest, makes the React adapter first-class, and leaves room for a Svelte package later without forcing that decision early.

## Core API

The vanilla core should attach a context menu behavior to one or more DOM targets.

Basic usage:

```ts
import { createContextMenu } from "popright";
import "popright/styles.css";

const menu = createContextMenu(document.querySelector("#file-row")!, {
  items: [
    { id: "open", label: "Open" },
    { id: "rename", label: "Rename", shortcut: "F2" },
    { type: "separator" },
    { id: "delete", label: "Delete", variant: "danger" }
  ],
  onSelect(event) {
    console.log(event.id);
  }
});

menu.destroy();
```

Dynamic usage:

```ts
const menu = createContextMenu(fileList, {
  items(context) {
    const row = context.triggerEvent.target.closest("[data-file-id]");
    const file = getFile(row.dataset.fileId);

    return [
      { id: "open", label: "Open" },
      { id: "rename", label: "Rename", disabled: file.locked },
      { type: "separator" },
      { id: "delete", label: "Delete", variant: "danger", disabled: file.readonly }
    ];
  },
  onSelect({ id, item, context }) {
    runFileAction(id, context);
  }
});
```

Programmatic usage:

```ts
const menu = createContextMenu({
  items,
  onSelect
});

menu.open({
  x: event.clientX,
  y: event.clientY,
  triggerEvent: event
});
```

## Internal Architecture

The public API should stay small, but internally Popright should be structured around two explicit concepts:

1. `ContextMenu`: one menu instance created by one `createContextMenu` call.
2. `MenuController`: the coordinator that manages all registered menu instances.

Each call to `createContextMenu` creates a `ContextMenu` instance and registers it with a controller. This should be transparent to the user.

```ts
const menu = createContextMenu(target, options);
```

Internally, that is roughly:

```ts
const contextMenu = new ContextMenu(defaultController, target, options);
defaultController.register(contextMenu);
return contextMenu.publicHandle;
```

### ContextMenu Responsibilities

`ContextMenu` owns per-menu behavior:

- Target registration.
- Native event listeners for its own target or targets.
- Option storage and updates.
- Resolving dynamic menu items.
- Rendering and removing its menu DOM.
- Focus capture and focus restoration.
- Active item state.
- Submenu state for its own menu tree.
- Calling per-menu callbacks.
- Destroying all resources associated with that menu.

Tentative internal shape:

```ts
class ContextMenu {
  constructor(
    controller: MenuController,
    target: ContextMenuTarget | null,
    options: ContextMenuOptions
  ) {}

  requestOpen(input: OpenInput): void;
  open(input: OpenInput): void;
  close(reason: CloseReason): void;
  update(options: Partial<ContextMenuOptions>): void;
  destroy(): void;

  containsTarget(target: EventTarget | null): boolean;
  getTargetDepth(eventTarget: EventTarget | null): number;
}
```

Important distinction:

- `requestOpen` asks the controller to open this menu.
- `open` performs the actual open after the controller chooses this menu.

All target-triggered opens should go through `requestOpen`, not directly through `open`.

### MenuController Responsibilities

`MenuController` owns global coordination:

- Registry of all live `ContextMenu` instances.
- The currently active menu.
- Ensuring only one root context menu is active at a time.
- Closing the previous menu before opening the next one.
- Disambiguating a single native event that could trigger multiple menus.
- Coordinating global Escape/outside-pointer behavior if implemented centrally.
- Handling active menu destruction.

Tentative internal shape:

```ts
class MenuController {
  register(menu: ContextMenu): void;
  unregister(menu: ContextMenu): void;

  requestOpen(menu: ContextMenu, input: OpenInput): void;
  closeActive(reason: CloseReason, nativeEvent?: Event): void;

  get activeMenu(): ContextMenu | null;
}
```

### Default Controller

Most users should not need to know a controller exists.

```ts
const defaultController = new MenuController();
```

By default, all `createContextMenu` calls register with the default controller.

Possible future advanced API:

```ts
const controller = createMenuController();

createContextMenu(targetA, { controller, items: itemsA });
createContextMenu(targetB, { controller, items: itemsB });
```

Reasons to expose custom controllers later:

- Test isolation.
- Multiple app shells on the same page.
- Shadow DOM boundaries.
- Iframe-like embedding scenarios.
- Apps that deliberately want independent menu groups.

Do not expose this in v1 unless a real use case appears. The internal design should still make it possible.

### Same-Event Disambiguation

A single `contextmenu` event can be observed by multiple registered menus when targets are nested or overlapping.

Example:

```html
<div data-menu="outer">
  <button data-menu="inner">Right click me</button>
</div>
```

If both elements have context menus and the user right-clicks the button, only the inner button menu should open.

Rule:

> When multiple `ContextMenu` instances request to open from the same native event, the controller opens the menu whose registered target is closest to the event target.

Tie-breaker:

> If two candidates are equally close, prefer the most recently registered menu.

Rationale:

- Nested UI should behave intuitively.
- The most specific target should win.
- Users should not need to stop event propagation manually.
- Multiple menus should never flicker open/closed from the same click.

Implementation sketch:

```ts
interface OpenCandidate {
  menu: ContextMenu;
  input: OpenInput;
  event: Event;
  targetDepth: number;
  registeredAt: number;
}
```

For each open request:

1. If there is no native event, open immediately through normal controller rules.
2. If there is a native event, group requests by event object.
3. Resolve candidates at the end of the current microtask or event turn.
4. Sort by closest target depth, then most recent registration.
5. Open the winning menu.
6. Ignore the losing candidates for that event.

Depth calculation:

- Start at `event.target`.
- Walk up through parent elements.
- The first registered target encountered is the closest candidate.
- Menus whose target does not contain the event target are not candidates for that event.

Pseudo-code:

```ts
function chooseCandidate(candidates: OpenCandidate[]): OpenCandidate {
  return candidates.sort((a, b) => {
    if (a.targetDepth !== b.targetDepth) {
      return a.targetDepth - b.targetDepth;
    }

    return b.registeredAt - a.registeredAt;
  })[0];
}
```

Lower `targetDepth` means closer to the original event target.

### Open Flow

Target-triggered open flow:

```text
native contextmenu event
  -> ContextMenu target listener
  -> menu.requestOpen(input)
  -> controller.requestOpen(menu, input)
  -> controller disambiguates candidates
  -> controller closes active menu if needed
  -> winningMenu.open(input)
```

Programmatic open flow:

```text
menu.open(input) public handle
  -> contextMenu.requestOpen(input)
  -> controller.requestOpen(contextMenu, input)
  -> controller closes active menu if needed
  -> contextMenu.open(input)
```

The public handle may expose a method named `open`, but internally it should still route through the controller. This preserves the invariant that the controller always knows which menu is active.

### Active Menu Invariant

At any time, a controller may have:

- Zero active root menus.
- One active root menu.

It must not have more than one active root menu.

Submenus are part of the active root menu and do not count as separate active root menus.

When a new root menu opens:

1. Close the old active root menu with reason `"reopen"`.
2. Set the new menu as active.
3. Open the new menu.

When the active menu closes:

1. Remove its DOM.
2. Clear active menu if it is still the controller's active menu.
3. Restore focus if appropriate.

When the active menu is destroyed:

1. Close it with reason `"destroy"`.
2. Unregister it.
3. Clear active menu.

## Core Function Signatures

Tentative API:

```ts
export function createContextMenu(
  target: Element | Document | Window | Iterable<Element>,
  options: ContextMenuOptions
): ContextMenuInstance;

export function createContextMenu(
  options: ContextMenuOptions
): ContextMenuInstance;
```

Instance:

```ts
export interface ContextMenuInstance {
  open(input: OpenInput): void;
  close(reason?: CloseReason): void;
  update(options: Partial<ContextMenuOptions>): void;
  destroy(): void;
  readonly isOpen: boolean;
  readonly root: HTMLElement | null;
}
```

Options:

```ts
export interface ContextMenuOptions {
  items: MenuItemsInput;
  onSelect?: (event: MenuSelectEvent) => void;
  onOpen?: (event: MenuOpenEvent) => void;
  onClose?: (event: MenuCloseEvent) => void;
  onBeforeOpen?: (event: MenuBeforeOpenEvent) => boolean | void;

  trigger?: "contextmenu" | "click" | "manual";
  placement?: "cursor" | "target";
  strategy?: "fixed" | "absolute";
  closeOnSelect?: boolean;
  closeOnBlur?: boolean;
  closeOnEscape?: boolean;
  modal?: boolean;

  collisionPadding?: number;
  maxHeight?: number | string;
  minWidth?: number | string;
  zIndex?: number;

  className?: string;
  classes?: ContextMenuClassNames;
  styles?: ContextMenuStyles;
  theme?: ContextMenuThemeInput;
  portal?: Element | false;
  dir?: "ltr" | "rtl";
}
```

The `className`, `classes`, and `styles` options exist to support the theming model inherited from `svelte-contextmenu`: global defaults with local override points.

```ts
export interface ContextMenuClassNames {
  menu?: string;
  item?: string;
  itemActive?: string;
  itemDisabled?: string;
  itemDanger?: string;
  separator?: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  submenu?: string;
  submenuTrigger?: string;
}

export interface ContextMenuStyles {
  menu?: Partial<CSSStyleDeclaration>;
  item?: Partial<CSSStyleDeclaration>;
  itemActive?: Partial<CSSStyleDeclaration>;
  itemDisabled?: Partial<CSSStyleDeclaration>;
  itemDanger?: Partial<CSSStyleDeclaration>;
  separator?: Partial<CSSStyleDeclaration>;
  label?: Partial<CSSStyleDeclaration>;
  icon?: Partial<CSSStyleDeclaration>;
  shortcut?: Partial<CSSStyleDeclaration>;
}
```

Theme input:

```ts
export type ContextMenuThemeInput =
  | "light"
  | "dark"
  | "system"
  | ContextMenuTheme
  | ContextMenuThemeStore;
```

Menu input:

```ts
export type MenuItemsInput =
  | MenuItem[]
  | ((context: MenuContext) => MenuItem[] | Promise<MenuItem[]>);
```

Open input:

```ts
export interface OpenInput {
  x?: number;
  y?: number;
  target?: Element;
  triggerEvent?: Event;
  context?: unknown;
}
```

## Menu Item Model

The item model should be concise, typed, and expressive enough for common application menus.

```ts
export type MenuItem =
  | MenuActionItem
  | MenuSeparatorItem
  | MenuLabelItem
  | MenuCheckboxItem
  | MenuRadioItem
  | MenuSubmenuItem;
```

Action item:

```ts
export interface MenuActionItem {
  type?: "item";
  id: string;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
  variant?: "default" | "danger";
  shortcut?: string;
  icon?: MenuIcon;
  description?: string;
  className?: string;
  classes?: Partial<ContextMenuClassNames>;
  style?: Partial<CSSStyleDeclaration>;
  value?: unknown;
  onSelect?: (event: MenuSelectEvent) => void;
}
```

Separator:

```ts
export interface MenuSeparatorItem {
  type: "separator";
  hidden?: boolean;
}
```

Label:

```ts
export interface MenuLabelItem {
  type: "label";
  label: string;
  hidden?: boolean;
}
```

Checkbox:

```ts
export interface MenuCheckboxItem {
  type: "checkbox";
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  shortcut?: string;
  onCheckedChange?: (checked: boolean, event: MenuSelectEvent) => void;
}
```

Radio:

```ts
export interface MenuRadioItem {
  type: "radio";
  id: string;
  label: string;
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
}
```

Submenu:

```ts
export interface MenuSubmenuItem {
  type: "submenu";
  id: string;
  label: string;
  disabled?: boolean;
  items: MenuItem[] | ((context: MenuContext) => MenuItem[] | Promise<MenuItem[]>);
}
```

Icon:

```ts
export type MenuIcon =
  | string
  | HTMLElement
  | ((context: MenuRenderContext) => Node | string);
```

The initial version may omit checkbox/radio/custom icon support if needed, but the item model should reserve a clean path for them.

## React API

The React adapter should be the first framework package because it has a concrete downstream use case: the resume builder.

The React package should remain thin. It should not reimplement menu behavior. It should translate React props and lifecycle into `@popright/core`.

### React Hook

Primary React API:

```tsx
import { useContextMenu } from "@popright/react";

function FileRow({ file }) {
  const contextMenu = useContextMenu({
    items: () => [
      { id: "open", label: "Open" },
      { id: "rename", label: "Rename", disabled: file.locked },
      { type: "separator" },
      { id: "delete", label: "Delete", variant: "danger" }
    ],
    onSelect({ id }) {
      runFileAction(id, file);
    }
  });

  return <div ref={contextMenu.ref}>{file.name}</div>;
}
```

The hook should return:

```ts
export interface UseContextMenuReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefCallback<T>;
  open: (input: OpenInput) => void;
  close: () => void;
  update: (options: Partial<ContextMenuOptions>) => void;
}
```

### React Component

Secondary React API:

```tsx
import { ContextMenu } from "@popright/react";

<ContextMenu items={items} onSelect={onSelect}>
  <FileRow file={file} />
</ContextMenu>
```

This component should be a convenience wrapper over the hook.

### React Event Integration

The React adapter should support both native context menu behavior and manual open:

```tsx
const menu = useContextMenu({ items, onSelect, trigger: "manual" });

return (
  <button
    onClick={(event) =>
      menu.open({
        x: event.clientX,
        y: event.clientY,
        triggerEvent: event.nativeEvent
      })
    }
  >
    Actions
  </button>
);
```

React-specific concerns:

- Avoid stale closures by updating the core instance when options change.
- Clean up on unmount.
- Support React 18 and later.
- Avoid requiring a provider.
- Do not render menu DOM through React in v1; let the core own the menu DOM.

## Svelte API

Svelte support is important, but it is not the first Popright adapter. The existing `svelte-contextmenu` package should remain the Svelte integration path while Popright proves the core and React package.

There are three possible Svelte futures:

1. Keep `svelte-contextmenu` as a separate Svelte-specific package.
2. Modernize `svelte-contextmenu` internally by adopting `@popright/core`.
3. Add `@popright/svelte` as a new adapter and migrate users gradually.

The decision should be made later, after the core is stable.

The Svelte API below is a possible future adapter shape.

The Svelte wrapper should expose both an action and a component.

### Svelte Action

The action is the primary ergonomic API.

```svelte
<script lang="ts">
  import { contextMenu } from "popright/svelte";

  const items = (ctx) => [
    { id: "open", label: "Open" },
    { id: "rename", label: "Rename", shortcut: "F2" },
    { type: "separator" },
    { id: "delete", label: "Delete", variant: "danger" }
  ];

  function onSelect({ id }) {
    console.log(id);
  }
</script>

<div use:contextMenu={{ items, onSelect }}>
  Right click me
</div>
```

The action should support updates:

```svelte
<div use:contextMenu={{ items, onSelect, disabled }} />
```

Action parameter:

```ts
export interface SvelteContextMenuOptions extends ContextMenuOptions {
  disabled?: boolean;
}
```

### Svelte Component

The component is useful when users want a wrapper with children.

```svelte
<ContextMenu {items} {onSelect}>
  <FileRow {file} />
</ContextMenu>
```

The component should be a thin wrapper over the action.

### Svelte Snippets / Custom Rendering

Custom rendering should be considered carefully. If Popright supports too much arbitrary rendering too early, it may become a second component framework.

Possible later API:

```svelte
<ContextMenu {items}>
  {#snippet item({ item, active })}
    <span class:active>{item.label}</span>
  {/snippet}
</ContextMenu>
```

For v1, prefer stable DOM attributes and CSS variables over custom render snippets.

## Rendering Model

The core should render its own DOM by default. This is what enables vanilla usage and keeps framework wrappers thin.

Menus should render into `document.body` by default. The menu DOM should not be inserted beside the trigger element unless the user opts into a custom portal target.

Default portal behavior:

```ts
portal: document.body
```

Default positioning behavior:

```ts
strategy: "fixed"
```

Rationale:

- Avoid clipping from `overflow: hidden` ancestors.
- Avoid local stacking-context surprises.
- Avoid transformed-parent coordinate bugs.
- Make cursor-based viewport positioning more predictable.
- Keep framework adapters simple.

Default DOM shape:

```html
<div class="pr-menu" role="menu" data-popright-menu>
  <div class="pr-item" role="menuitem" tabindex="-1" data-popright-item>
    <span class="pr-icon" aria-hidden="true"></span>
    <span class="pr-label">Rename</span>
    <span class="pr-shortcut" aria-hidden="true">F2</span>
  </div>
  <div class="pr-separator" role="separator"></div>
  <div class="pr-item pr-item-danger" role="menuitem" tabindex="-1">
    <span class="pr-label">Delete</span>
  </div>
</div>
```

Prefer data attributes as the stable styling contract:

```html
data-popright-menu
data-popright-item
data-popright-active
data-popright-disabled
data-popright-variant="danger"
data-popright-separator
data-popright-submenu
```

CSS class names can exist for convenience but should not be the only stable API.

## Accessibility Contract

Context menus are not trivial. Popright should document exactly what it supports.

### Roles

Menu root:

```html
role="menu"
```

Action item:

```html
role="menuitem"
```

Checkbox item:

```html
role="menuitemcheckbox"
aria-checked="true|false"
```

Radio item:

```html
role="menuitemradio"
aria-checked="true|false"
```

Separator:

```html
role="separator"
```

Disabled items:

```html
aria-disabled="true"
```

Submenu trigger:

```html
aria-haspopup="menu"
aria-expanded="true|false"
```

### Focus Behavior

On open:

- Save the previously focused element.
- Render the menu.
- Move focus to the first enabled item.
- If no enabled item exists, focus the menu root.

On close:

- Remove the menu DOM.
- Return focus to the previous focused element when reasonable.
- If the original element is gone or no longer focusable, skip focus restoration.

Disabled items:

- Should not be selectable.
- May be skipped by arrow navigation by default.
- Should expose disabled state to assistive tech.

### Keyboard Behavior

Minimum v1 behavior:

- `ArrowDown`: move to next enabled item.
- `ArrowUp`: move to previous enabled item.
- `Home`: move to first enabled item.
- `End`: move to last enabled item.
- `Enter`: select active item.
- `Space`: select active item.
- `Escape`: close menu.
- `Tab`: close menu and allow normal tab navigation, or trap depending on `modal`.
- `ArrowRight`: open submenu in LTR.
- `ArrowLeft`: close submenu in LTR.

Optional but desirable:

- Typeahead search by visible label.
- RTL-aware left/right submenu behavior.

### Focus Implementation Choice

Use roving `tabindex` for v1.

Each focusable item receives `tabindex="-1"` except the active item, which receives `tabindex="0"`. The active item is focused directly.

Alternative: `aria-activedescendant` on the menu root. This can be cleaner for some virtualized structures, but direct item focus is simpler and familiar for a small menu library.

## Pointer and Mouse Behavior

Open behavior:

- Listen to `contextmenu` by default.
- Prevent the native browser menu when Popright opens.
- Place the menu at the pointer coordinates for right-click.
- Support programmatic open for custom triggers.

Pointer behavior:

- Hovering an enabled item makes it active.
- Clicking an enabled item selects it.
- Clicking outside closes the menu.
- Right-clicking another target should close the current menu and open the new one.
- Pointer down inside the menu should not close it before item activation.

Touch behavior:

- Do not promise first-class mobile/touch support in v1 unless implemented deliberately.
- Later option: long-press trigger.

## Overflow and Positioning

Overflow behavior is a core differentiator.

### Basic Algorithm

For root menu:

1. Render menu offscreen or hidden so dimensions can be measured.
2. Start at desired coordinates.
3. If the menu would overflow right edge, shift left.
4. If the menu would overflow bottom edge, shift up.
5. Clamp to collision padding.
6. If menu is taller than available space, set `max-height` and allow internal scrolling.

For submenu:

1. Prefer opening to the right in LTR and left in RTL.
2. If there is not enough horizontal space, flip to the opposite side.
3. Align top edge with submenu trigger.
4. If it overflows vertically, shift within viewport.
5. Constrain max height if needed.

### Coordinate Strategy

Default:

```ts
strategy: "fixed"
```

Rationale:

- Context menus usually position relative to the viewport.
- Fixed positioning avoids many scroll offset bugs.
- Portaling to `document.body` becomes straightforward.

Support `absolute` later if needed for embedded surfaces.

### Boundary

Initial boundary:

```ts
boundary: viewport
```

Possible later option:

```ts
boundary?: "viewport" | Element | "clippingAncestors";
```

Do not overbuild this before real use cases demand it.

## Submenus

Submenus are useful but are where many context menu libraries get fragile.

Minimum behavior:

- Render submenu on hover or `ArrowRight`.
- Keep submenu open when pointer moves from trigger into submenu.
- Close sibling submenus when another submenu opens.
- Flip submenu if it would overflow horizontally.
- Close submenu with `ArrowLeft` or Escape.

Intent handling:

- Add a small open delay, for example 100ms.
- Add a small close delay, for example 150ms.
- Consider pointer triangle/intent tracking later, but keep v1 simple unless submenu UX feels bad.

ARIA:

- Submenu trigger uses `aria-haspopup="menu"`.
- `aria-expanded` reflects open state.
- Submenu content uses `role="menu"`.

## State Model

Internally, Popright should track:

```ts
interface MenuState {
  open: boolean;
  rootMenu: RenderedMenu | null;
  activePath: number[];
  openSubmenus: number[][];
  context: MenuContext | null;
  previousFocus: Element | null;
}
```

The active path identifies the active item through nested menus:

```ts
[2]       // third item in root menu
[2, 4]    // fifth item inside submenu at root item 2
```

Each rendered menu should know:

- Its item list.
- Its DOM root.
- Its parent menu if any.
- Its submenu trigger item if any.
- Its current active item.

## Event Model

Selection event:

```ts
export interface MenuSelectEvent {
  id: string;
  item: MenuSelectableItem;
  nativeEvent: Event;
  context: MenuContext;
  close: () => void;
  preventClose: () => void;
}
```

Open event:

```ts
export interface MenuOpenEvent {
  context: MenuContext;
  root: HTMLElement;
}
```

Close event:

```ts
export interface MenuCloseEvent {
  reason: CloseReason;
  nativeEvent?: Event;
}
```

Close reasons:

```ts
export type CloseReason =
  | "select"
  | "escape"
  | "outside-pointer"
  | "blur"
  | "manual"
  | "destroy"
  | "reopen";
```

## Styling

Popright should ship a restrained default style that works immediately but is easy to override.

The styling model should preserve one of the best ergonomics from `svelte-contextmenu`: a global theme with local overrides.

Users should be able to:

- Use the default Popright theme with no CSS.
- Override global styles through CSS variables.
- Override global structural classes through options.
- Override a single menu's classes/styles.
- Override a single item's classes/styles.
- Target stable data attributes in their own CSS.

The hierarchy should be:

1. Popright default classes and CSS variables.
2. Global theme store defaults.
3. Per-menu `className`, `classes`, and `styles`.
4. Per-item `className`, `classes`, and `style`.

Local overrides should augment default classes by default rather than replacing every internal class. This keeps built-in behavior and layout stable while allowing users to customize appearance.

### Theme Store

Popright should expose a small global theme store. This lets applications configure the default appearance once while still allowing each menu to override locally.

The store should be framework-agnostic and evented.

Sketch:

```ts
export interface ContextMenuThemeStore {
  get(): ContextMenuTheme;
  set(theme: ContextMenuThemeInput): void;
  update(updater: (theme: ContextMenuTheme) => ContextMenuTheme): void;
  subscribe(listener: (theme: ContextMenuTheme) => void): () => void;
}

export const contextMenuTheme: ContextMenuThemeStore;
```

`subscribe` should return an unsubscribe function. Internally this can be implemented with a small event emitter, an `EventTarget`, or a simple Set of listeners. Avoid framework-specific stores in `@popright/core`.

The store should emit when:

- The active global theme changes.
- Theme tokens change.
- The light/dark/system mode changes.

Open menus should be able to respond to global theme changes without being destroyed and recreated. The simplest implementation is to update data attributes and CSS variables on the existing menu root when the theme store emits.

Possible theme model:

```ts
export interface ContextMenuTheme {
  mode: "light" | "dark" | "system";
  className?: string;
  classes?: ContextMenuClassNames;
  styles?: ContextMenuStyles;
  tokens?: Partial<ContextMenuThemeTokens>;
}

export interface ContextMenuThemeTokens {
  bg: string;
  color: string;
  border: string;
  shadow: string;
  radius: string;
  padding: string;
  itemHeight: string;
  itemGap: string;
  activeBg: string;
  disabledColor: string;
  dangerColor: string;
  zIndex: string | number;
}
```

Global usage:

```ts
import { contextMenuTheme } from "@popright/core";

contextMenuTheme.set("dark");
```

Custom global theme:

```ts
contextMenuTheme.set({
  mode: "dark",
  className: "app-context-menu",
  tokens: {
    bg: "#18181b",
    color: "#fafafa",
    activeBg: "#27272a"
  }
});
```

Per-menu override:

```ts
createContextMenu(target, {
  items,
  theme: "light"
});
```

Theme precedence:

1. Built-in fallback theme.
2. Global `contextMenuTheme`.
3. Per-menu `theme`.
4. Per-menu `classes`/`styles`.
5. Per-item `className`/`classes`/`style`.

### SCSS Source

Popright should author its default styles in SCSS and ship compiled CSS.

Source file:

```text
packages/core/src/styles/popright.scss
```

Published CSS:

```text
@popright/core/styles.css
```

The SCSS should provide sane, attractive defaults without requiring a design system. It should define the base structure, item layout, active states, disabled states, separators, shortcut alignment, submenu affordances, and light/dark variables.

The compiled CSS should be optional:

```ts
import "@popright/core/styles.css";
```

Applications with their own styling can skip the default CSS and target data attributes/classes directly.

### Light and Dark Mode

Popright should ship first-class light and dark themes.

Default behavior:

```ts
theme: "system"
```

`system` should follow `prefers-color-scheme` using CSS media queries where possible. Runtime JS should not be required just to follow system dark mode.

Recommended CSS shape:

```scss
:root {
  --popright-bg: #ffffff;
  --popright-color: #171717;
  --popright-border: #d4d4d4;
  --popright-active-bg: #f4f4f5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --popright-bg: #18181b;
    --popright-color: #fafafa;
    --popright-border: #3f3f46;
    --popright-active-bg: #27272a;
  }
}

[data-popright-theme="light"] {
  color-scheme: light;
}

[data-popright-theme="dark"] {
  color-scheme: dark;
}
```

If the theme store sets `"light"` or `"dark"`, the menu root should receive:

```html
data-popright-theme="light"
```

or:

```html
data-popright-theme="dark"
```

If the theme is `"system"`, the menu can either omit the attribute or set:

```html
data-popright-theme="system"
```

The exact CSS strategy can be finalized during implementation, but light and dark defaults are v1 requirements.

Default design:

- Neutral background.
- Thin border.
- Small shadow.
- 4-8px radius.
- Compact row height.
- Clear hover/active state.
- Danger variant.
- Disabled state.
- Shortcut column.

CSS variables:

```css
:root {
  --popright-bg: white;
  --popright-color: #171717;
  --popright-border: #d4d4d4;
  --popright-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
  --popright-radius: 6px;
  --popright-padding: 4px;
  --popright-item-height: 28px;
  --popright-item-gap: 24px;
  --popright-active-bg: #f4f4f5;
  --popright-disabled-color: #a1a1aa;
  --popright-danger-color: #dc2626;
  --popright-z-index: 1000;
}
```

The root z-index variable is the v1 stacking strategy. Popright should not scan the page to detect the maximum z-index by default.

Reasons not to scan for max z-index:

- It requires reading computed styles for many elements.
- It can be expensive on large pages.
- `z-index` is scoped by stacking contexts, so a global maximum can be misleading.
- Pages sometimes use intentionally extreme z-index values.
- Deterministic CSS is easier to debug than automatic stacking escalation.

Users can override stacking with CSS:

```css
:root {
  --popright-z-index: 10000;
}
```

or through an option if the implementation supports it:

```ts
createContextMenu(target, {
  zIndex: 10000
});
```

Selectors:

```css
[data-popright-menu] {}
[data-popright-item] {}
[data-popright-item][data-active] {}
[data-popright-item][data-disabled] {}
[data-popright-item][data-variant="danger"] {}
[data-popright-separator] {}
[data-popright-shortcut] {}
```

Do not require users to use the default CSS.

Example local menu override:

```ts
createContextMenu(target, {
  items,
  className: "my-app-menu",
  classes: {
    item: "my-app-menu-item",
    itemActive: "my-app-menu-item-active",
    itemDanger: "my-app-menu-item-danger"
  }
});
```

Example per-item override:

```ts
[
  {
    id: "delete",
    label: "Delete",
    variant: "danger",
    className: "file-action-delete",
    style: {
      fontWeight: "600"
    }
  }
]
```

The implementation should be careful with inline styles. They are useful for escape hatches and generated menus, but CSS classes and variables should be the preferred customization path.

## Error Handling

Popright should fail softly where possible.

Examples:

- If `items` returns an empty array, do not open the menu.
- If all items are hidden/separators, do not open the menu.
- If an async `items` resolver rejects, do not open and call `onClose`/`onError` if defined.
- If target is missing during adapter initialization, no-op.
- If `destroy()` is called multiple times, no-op.

Possible option:

```ts
onError?: (error: unknown) => void;
```

## Async Items

Async item support is useful, but it complicates UX.

Possible v1 stance:

- Support `items` returning `MenuItem[]`.
- Do not support async items in v1.

Possible v1.1 stance:

- Support promises.
- Show optional loading item.
- Cancel stale opens when a newer open happens.

If async is supported, use an internal open token:

```ts
const openId = ++currentOpenId;
const items = await resolveItems(context);
if (openId !== currentOpenId) return;
```

Recommendation:

Keep the type path open, but defer async until the synchronous core is excellent.

## Testing Strategy

Use automated tests for the behavior that tends to regress.

Suggested stack:

- Vitest for unit tests.
- Playwright for browser behavior.
- jsdom only for pure item normalization and state helpers.

Core test areas:

- Opening on `contextmenu`.
- Preventing native context menu.
- Closing on Escape.
- Closing on outside pointer.
- Selecting item with mouse.
- Selecting item with Enter/Space.
- Disabled item cannot be selected.
- Arrow navigation skips separators/disabled items.
- Home/End navigation.
- Focus returns after close.
- Empty menus do not open.
- Dynamic resolver receives trigger event/context.
- `destroy()` removes listeners and DOM.
- Root menu flips/shifts when near viewport edges.
- Root menu constrains height when too tall.
- Submenu opens with hover/keyboard.
- Submenu flips when near right edge.

Accessibility checks:

- Role assertions.
- `aria-disabled`.
- `aria-haspopup`.
- `aria-expanded`.
- `aria-checked` for checkbox/radio when implemented.

Manual demo checks:

- Right-click in all four viewport corners.
- Right-click in a scroll container.
- Keyboard-only operation.
- Nested submenu near viewport edge.
- Rapidly open on different targets.
- Destroy/recreate during app navigation.

## Demo App

The demo should be a real app surface rather than a marketing page.

Recommended demo scenarios:

1. File list with state-derived menu.
2. Table rows with disabled/danger actions.
3. Canvas-like area with coordinate-specific menu.
4. Nested submenu.
5. Viewport edge/overflow test zone.

The first screen should show the usable demo immediately.

Demo interactions:

- Right-click file row.
- Right-click empty area.
- Toggle locked/read-only state to affect disabled items.
- Show selected action in a small log.

Avoid giant hero sections. This is a developer tool; the demo should prove behavior quickly.

### GitHub Pages Demo

Popright should have a live GitHub Pages demo as part of v1.

The demo should be published automatically from the repository's GitHub Actions workflow. A user evaluating the project should be able to click one public URL and immediately test the core behavior in a browser.

Recommended deployment shape:

```text
examples/
  site/
    src/
    package.json
```

or:

```text
apps/
  docs/
    src/
    package.json
```

The exact folder name can follow the chosen workspace tooling, but the demo should be treated as a first-class project in the repo.

GitHub Pages requirements:

- Build the demo from the current workspace packages.
- Deploy on pushes to the default branch.
- Make the deployed URL visible in the README.
- Include the live demo URL in the package metadata if appropriate.
- Avoid manual deploy steps.

GitHub Actions workflow requirements:

- Install dependencies.
- Run typecheck/build/tests.
- Build the demo site.
- Upload the static site artifact.
- Deploy to GitHub Pages.

Suggested workflow file:

```text
.github/workflows/pages.yml
```

Suggested high-level workflow:

```yaml
name: Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run test
      - run: npm run build
      - run: npm run build:demo
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./apps/docs/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

The exact npm scripts and artifact path should match the final repo structure.

## Documentation Structure

Initial docs:

- README
- API reference
- Accessibility notes
- Styling guide
- React usage
- Svelte strategy
- Examples
- Migration notes from simple context menu packages

README outline:

1. What Popright is.
2. Install.
3. Basic vanilla usage.
4. Dynamic menu usage.
5. React hook usage.
6. Svelte strategy.
6. Accessibility/behavior summary.
7. Styling.
8. Browser support.

## Browser Support

Target modern evergreen browsers:

- Chrome/Edge
- Firefox
- Safari

Avoid legacy browser support unless it is nearly free.

Use:

- TypeScript.
- Standard DOM APIs.
- Pointer events if useful.
- No runtime dependency on frameworks.

## Dependency Policy

Default goal:

- Zero runtime dependencies.

Possible exception:

- Floating UI, if collision behavior becomes too complex.

However, for a context menu with cursor and submenu positioning, a small custom positioning function is likely enough for v1.

Do not pull in a general UI primitive library. That would blur the purpose of the project.

## Implementation Phases

### Phase 1: Core Skeleton

- Package setup.
- TypeScript build.
- Basic `createContextMenu`.
- Static item rendering.
- Contextmenu listener.
- Open/close/destroy.
- Default SCSS source and compiled CSS.
- Light and dark default themes.
- Global theme store skeleton.
- Minimal demo.
- Initial GitHub Actions build/test workflow.

### Phase 2: Production Basics

- ARIA roles.
- Focus on open.
- Focus return on close.
- Escape close.
- Outside pointer close.
- Arrow/Home/End navigation.
- Enter/Space selection.
- Disabled/separator support.

### Phase 3: Positioning

- Viewport collision handling.
- Horizontal/vertical flipping/shifting.
- Collision padding.
- Max height/scroll behavior.
- Tests for edge placement.

### Phase 4: Dynamic Menus

- Item resolver function.
- Context object.
- Per-item `onSelect`.
- Global `onSelect`.
- Hidden items.
- Empty-menu behavior.

### Phase 5: React Wrapper

- React hook.
- React component.
- React demo.
- Type exports.
- Include React demo scenario in the live demo site.

### Phase 6: Svelte Strategy

- Decide whether to leave `svelte-contextmenu` separate.
- Decide whether to modernize `svelte-contextmenu` with `@popright/core`.
- Decide whether `@popright/svelte` should exist.
- If needed, implement Svelte action/component.

### Phase 7: Submenus

- Submenu item model.
- Hover open.
- Keyboard open/close.
- Submenu collision.
- Submenu ARIA.
- Tests.

### Phase 8: Polish

- Checkbox/radio items.
- Typeahead.
- RTL.
- Theme store cleanup.
- CSS variables/SCSS cleanup.
- Documentation pass.
- Browser visual verification.
- GitHub Pages deployment workflow.
- Live demo URL linked from README.

## Open Questions

1. Should the first release include submenus, or should submenus wait until the root menu is excellent?
2. Should async item resolvers be supported in v1?
3. Should checkbox/radio items be in v1 or v1.1?
4. Should Popright use direct DOM rendering only, or support custom render callbacks?
5. Should the Svelte wrapper expose snippets if it exists?
6. Should package publishing start as `@popright/core` and `@popright/react` from day one?
7. Should long-press/touch context menus be supported?
8. Should the positioning boundary be viewport-only in v1?
9. Should disabled items be focusable or skipped? Recommendation: skipped by default, possibly configurable later.
10. Should clicking a checkbox/radio item close the menu? Recommendation: configurable, default close for consistency unless multi-toggle menus are a major use case.

## Competitive Positioning

Against `ctxmenu`:

- Similar data-driven feel.
- More deliberate ARIA.
- More deliberate keyboard behavior.
- More deliberate overflow behavior.
- Better TypeScript surface.
- More production-oriented lifecycle and tests.

Against `vanilla-context-menu`:

- More modern package/API.
- More explicit accessibility contract.
- Cleaner adapter story.

Against shadcn/Bits/Zag/Ark:

- Less broad and less compositional.
- Much simpler for dynamic menus.
- Framework optional.
- Better fit for small tools, app surfaces, file explorers, tables, editors, dashboards, and canvas/node UIs.

## Proposed Taglines

- Modern context menus that pop right.
- Data-driven context menus for modern web apps.
- Right-click menus without the ceremony.
- Tiny context menus with production behavior.

## Definition of Done for v1

Popright v1 is ready when:

- Vanilla API can attach to a target and open a dynamic menu.
- React hook works cleanly.
- Menu has correct core ARIA roles.
- Keyboard navigation works.
- Focus restoration works.
- Disabled items and separators work.
- Viewport collision works in all four corners.
- Menu can be destroyed without leaked DOM/listeners.
- Global theme store exists and can update menu defaults.
- Sane default SCSS/CSS ships with the package.
- Light and dark themes work.
- Build passes.
- Browser tests cover core interactions.
- Vanilla and React demos prove dynamic app-style menus.
- A live GitHub Pages demo is deployed and linked from the README.
- GitHub Actions automatically builds, tests, builds the demo, and deploys GitHub Pages on pushes to the default branch.
- README accurately describes limitations.
