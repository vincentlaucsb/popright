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
- [x] ~~Dropdown menus and context menus share one active root menu slot.~~
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
- [x] ~~Dropdown menus open on click and anchor to the trigger element.~~
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
- [x] ~~Opens in the bottom-right viewport corner without overflowing.~~
- [x] ~~Horizontally flips or shifts near viewport edges.~~
- [x] ~~Vertically flips or shifts near viewport edges.~~
- [x] ~~Honors `collisionPadding`.~~
- [x] ~~Applies max height to long menus.~~
- [x] ~~Long menus scroll.~~
- [x] ~~Works on a scrolled page.~~
- [ ] Works inside a scroll container.
- [x] ~~Uses fixed coordinates predictably when portaled to `document.body`.~~
- [ ] Target placement supports all side/align combinations near viewport edges.
- [x] ~~RTL target placement maps start/end predictably.~~

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
- [x] ~~RTL menus mirror submenu arrow affordance.~~
- [ ] Screen-reader review of dropdown and context menu patterns.
- [ ] Checkbox items expose `role="menuitemcheckbox"` and `aria-checked` when implemented.
- [ ] Radio items expose `role="menuitemradio"` and `aria-checked` when implemented.

## React Adapter Tests

- [x] ~~`useContextMenu` attaches a core menu to the ref element.~~
- [x] ~~`useContextMenu` detaches from the previous ref element.~~
- [x] ~~`useContextMenu` updates options without stale closures.~~
- [x] ~~Unmount destroys the core instance.~~
- [ ] Manual `open()` passes React `nativeEvent`.
- [x] ~~Hook supports React 18 and later.~~
- [x] ~~Hook does not require a provider.~~
- [x] ~~`ContextMenu` component wraps the hook.~~
- [x] ~~`ContextMenu` preserves child props.~~
- [x] ~~`ContextMenu` preserves child refs where possible.~~
- [x] ~~`useDropdownMenu` attaches a core dropdown menu to the ref element.~~
- [x] ~~`DropdownMenu` component wraps the hook.~~

## Demo And Smoke Tests

- [x] ~~Vanilla demo builds.~~
- [x] ~~Demo serves over `http://localhost`.~~
- [x] ~~Demo has no console errors on first load.~~
- [x] ~~Demo light/dark toggle updates page colors.~~
- [x] ~~Demo light/dark toggle updates context menu colors.~~
- [x] ~~Demo action buttons use `createDropdownMenu`.~~
- [x] ~~Playwright verifies RTL dropdown submenu affordance.~~
- [x] ~~Playwright verifies priority collision regressions.~~
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
- [x] ~~GitHub Pages deployment builds the demo from workspace packages.~~
- [ ] Published package includes compiled JS, declarations, and CSS.
- [x] ~~CommonJS build exposes the core factory entrypoint.~~
- [ ] CommonJS build exposes the React adapter entrypoint in a packed install smoke test.
- [ ] Release bundle can include minified JS without changing source files.

## Product Judgment Needed

- [ ] Decide whether `system` remains a documented alias for `automatic` or becomes internal compatibility only.
- [ ] Decide whether dropdown-specific CSS should stay minimal or grow documented integration recipes first.
- [ ] Decide whether recursive submenus remain intentionally unsupported for the next public release.
- [ ] Decide whether Popright should ever ship animation examples, even as opt-in snippets.
