# Popright Test TODO

## Core Unit Tests

- [x] ~~`createContextMenu` returns a stable public handle without a DOM.~~
- [x] ~~Theme store supports `get`, `set`, `update`, `subscribe`, and unsubscribe.~~
- [x] ~~Default controller exposes one active menu slot.~~
- [x] ~~Item normalization filters hidden items.~~
- [ ] Empty menus do not open.
- [ ] Separator-only menus do not open.
- [ ] Disabled items are not selectable.
- [x] ~~Labels and separators are skipped by navigation.~~
- [x] ~~First enabled item is selected on open.~~
- [x] ~~Home/End choose first/last enabled item.~~
- [x] ~~Theme token merging preserves global defaults.~~
- [ ] Per-menu theme overrides global theme.
- [ ] Class/style overrides compose with default classes.
- [x] ~~Controller closes the active menu before opening another menu.~~
- [x] ~~Same native event opens the closest registered target.~~
- [x] ~~Same-depth native event prefers the most recently registered menu.~~
- [x] ~~`update()` swaps callbacks/options without recreating the instance.~~
- [ ] Missing targets no-op.
- [x] ~~Double `destroy()` no-ops.~~
- [x] ~~Async item resolver path is explicitly unsupported until implemented.~~

## Browser Behavior Tests

- [x] ~~Opens on `contextmenu`.~~
- [x] ~~Opens on click trigger.~~
- [x] ~~Opens on `click` when `trigger: "click"` is configured.~~
- [ ] Prevents the native browser context menu when Popright opens.
- [ ] Opens programmatically at provided coordinates.
- [ ] Closes on Escape.
- [ ] Closes on outside pointer.
- [x] ~~Closes on scroll by default.~~
- [x] ~~Closes on resize by default.~~
- [x] ~~Can opt out of scroll/resize close behavior.~~
- [ ] Pointer down inside the menu does not close before item activation.
- [ ] Focus moves to the menu on open.
- [ ] Focus returns to the previous element on close.
- [ ] Mouse select calls per-item `onSelect`.
- [x] ~~Mouse select calls global `onSelect`.~~
- [ ] Enter selects the active item.
- [ ] Space selects the active item.
- [ ] ArrowUp/ArrowDown skip disabled items and separators.
- [ ] Home/End navigation works.
- [ ] Disabled item cannot be selected by mouse.
- [ ] Disabled item cannot be selected by keyboard.
- [ ] `destroy()` removes menu DOM.
- [ ] `destroy()` removes target listeners.
- [ ] Dynamic resolver receives trigger event, target, x/y, and custom context.
- [ ] Hidden/empty/separator-only dynamic menus do not open.

## Positioning Tests

- [ ] Opens in the top-left viewport corner without overflowing.
- [ ] Opens in the top-right viewport corner without overflowing.
- [ ] Opens in the bottom-left viewport corner without overflowing.
- [ ] Opens in the bottom-right viewport corner without overflowing.
- [ ] Horizontally flips or shifts near viewport edges.
- [ ] Vertically flips or shifts near viewport edges.
- [ ] Honors `collisionPadding`.
- [ ] Applies max height to long menus.
- [ ] Long menus scroll.
- [ ] Works on a scrolled page.
- [ ] Works inside a scroll container.
- [ ] Uses fixed coordinates predictably when portaled to `document.body`.

## Accessibility Tests

- [x] ~~Root menu has `role="menu"`.~~
- [x] ~~Action items have `role="menuitem"`.~~
- [ ] Separators have `role="separator"`.
- [ ] Disabled items expose `aria-disabled="true"`.
- [ ] Active item state is represented consistently.
- [ ] Focus is not lost when the menu opens.
- [ ] Focus restoration skips removed/non-focusable previous elements.
- [ ] Submenu triggers expose `aria-haspopup="menu"` when submenus land.
- [ ] Submenu triggers update `aria-expanded` when submenus land.
- [ ] Submenu content has `role="menu"` when submenus land.
- [ ] Checkbox items expose `role="menuitemcheckbox"` and `aria-checked` when implemented.
- [ ] Radio items expose `role="menuitemradio"` and `aria-checked` when implemented.

## React Adapter Tests

- [ ] `useContextMenu` attaches a core menu to the ref element.
- [ ] `useContextMenu` detaches from the previous ref element.
- [ ] `useContextMenu` updates options without stale closures.
- [ ] Unmount destroys the core instance.
- [ ] Manual `open()` passes React `nativeEvent`.
- [ ] Hook supports React 18 and later.
- [ ] Hook does not require a provider.
- [ ] `ContextMenu` component wraps the hook.
- [ ] `ContextMenu` preserves child props.
- [ ] `ContextMenu` preserves child refs where possible.

## Demo And Smoke Tests

- [x] ~~Vanilla demo builds.~~
- [x] ~~Demo serves over `http://localhost`.~~
- [x] ~~Demo has no console errors on first load.~~
- [x] ~~Demo light/dark toggle updates page colors.~~
- [x] ~~Demo light/dark toggle updates context menu colors.~~
- [ ] Demo selected action log updates.
- [ ] Demo proves disabled state from dynamic row data.
- [ ] React demo builds when Phase 5 lands.
- [ ] React demo is included in the live demo site when Phase 5 lands.

## CI And Release Checks

- [ ] `npm ci` succeeds.
- [ ] `npm run check` succeeds.
- [ ] `npm run build` succeeds.
- [x] ~~`npm run test` succeeds.~~
- [x] ~~`npm run build:demo` succeeds.~~
- [ ] GitHub Actions runs check/build/test/demo on pull requests.
- [ ] GitHub Pages deployment builds the demo from workspace packages.
- [ ] Published package includes compiled JS, declarations, and CSS.
- [ ] Release bundle can include minified JS without changing source files.
