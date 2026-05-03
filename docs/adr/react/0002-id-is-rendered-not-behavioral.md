# ADR 0002: ID Is Rendered, Not Behavioral

Date: 2026-05-03

## Status

Accepted

## Context

Experiencer's current context menu API uses matching string IDs to connect triggers to menus. This is convenient for migration, and existing styles may target menu IDs such as `resume-menu`.

However, using IDs as behavior wiring creates hidden global coupling. Popright already has an explicit controller and React can use ownership/context to connect trigger and content.

## Decision

React menu components may accept an `id` prop, but Popright must treat it only as a rendered DOM attribute for styling, testing, and compatibility.

`id` must not be used to:

- register menus
- pair triggers with content
- open menus
- close menus
- select a controller candidate

Trigger/content ownership must come from React structure and context:

```tsx
<ContextMenu id="resume-menu">
  <ContextMenuTrigger asChild>
    <div>Right-click me</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

The rendered menu root may receive `id="resume-menu"`.

If both `ContextMenu` and `ContextMenuContent` provide IDs, `ContextMenuContent id` wins.

## Consequences

Existing targeted styles can survive migration, but Popright does not recreate Experiencer's global ID registry. This keeps behavior explicit and avoids spooky cross-tree coupling.
