# @popright/react

React bindings for Popright context menus.

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
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

Install `@popright/react` for React apps. It depends on `popright` and expects React 18 or newer as a peer dependency.
