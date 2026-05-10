<p align="center">
  <img src="assets/popright-logo.png" alt="Popright logo" width="720">
</p>

# Popright

Popright is a tiny, typed, data-driven menu primitive for modern web apps.

Popright supports context menus and dropdown/action menus because those are the same interaction once they are open: a transient command surface with positioning, keyboard navigation, focus ownership, outside-click dismissal, submenus, and cleanup. The only meaningful difference is how the menu is triggered and anchored. Context menus usually open from pointer coordinates; dropdowns usually open from a trigger element.

That shared runtime is intentional. Popright uses one controller for all root menus, so only one dropdown or context menu can be visible at a time. Opening a dropdown closes an open context menu, and opening a context menu closes an open dropdown.

This repository is in early implementation. The current build includes the framework-agnostic core package and a React adapter package.

## Packages

- `popright`
- `@popright/react`

## Basic Usage

```ts
import { createContextMenu, createDropdownMenu } from "popright";
import "popright/styles.css";

const menu = createContextMenu(document.querySelector("#file-row")!, {
  items: [
    { id: "open", label: "Open" },
    { id: "rename", label: "Rename", shortcut: "F2" },
    { type: "separator" },
    { id: "delete", label: "Delete", variant: "danger" }
  ],
  onSelect({ id }) {
    console.log(id);
  }
});

menu.destroy();
```

```ts
const dropdown = createDropdownMenu(document.querySelector("#file-button")!, {
  items: [
    { id: "new", label: "New" },
    { id: "open", label: "Open" },
    { type: "separator" },
    { id: "print", label: "Print" }
  ]
});

dropdown.destroy();
```

## React Usage

```tsx
import { useContextMenu } from "@popright/react";

function AlbumRow({ album }) {
  const menu = useContextMenu<HTMLDivElement>({
    items: album.songs.map((song) => ({ id: song, label: song })),
    onSelect({ id }) {
      console.log(id);
    }
  });

  return <div ref={menu.ref}>{album.title}</div>;
}
```

```tsx
import { ContextMenu, DropdownMenu } from "@popright/react";

<ContextMenu items={[{ id: "play", label: "Play" }]}>
  <button type="button">Actions</button>
</ContextMenu>;

<DropdownMenu items={[{ id: "new", label: "New" }]}>
  <button type="button">File</button>
</DropdownMenu>;
```

## Design Goals

- Context menus and dropdowns share one controller and one active-menu invariant.
- Menus are data-first and can be generated from application state.
- The core works without React; React is an adapter.
- Menus appear immediately. Popright does not ship built-in animations.
- Styling uses CSS variables, classes, and data attributes without design-system lock-in.

## Scripts

```sh
npm run build
npm run check
npm run test
npm run test:visual
npm run test:visual:update-screenshots
npm run build:demo
npm run serve:demo
```

The built demo is written to `dist-demo/index.html` and should be served at `http://localhost:4173`.

The workspace is intentionally dependency-light while the core API settles.
