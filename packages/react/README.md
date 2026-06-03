# @popright/react

React bindings for Popright context menus and dropdown menus.

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu
} from "@popright/react";
import "popright/styles.css";

export function RowMenu() {
  return (
    <ContextMenu onSelect={({ id }) => console.log(id)}>
      <ContextMenuTrigger asChild>
        <button type="button">Actions</button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem id="open">Open</ContextMenuItem>
        <ContextMenuItem id="rename" shortcut="F2">
          Rename
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

```tsx
export function FileMenu() {
  return (
    <DropdownMenu items={[{ id: "new", label: "New" }]}>
      <button type="button">File</button>
    </DropdownMenu>
  );
}
```

Install `@popright/react` for React apps. It depends on `popright` and expects React 18 or newer as a peer dependency.
