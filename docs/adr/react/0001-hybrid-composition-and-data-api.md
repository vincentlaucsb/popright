# ADR 0001: Hybrid Composition and Data API

Date: 2026-05-03

## Status

Accepted

## Context

Popright's core API is data-driven, which is ideal for dynamic application menus. React users also expect a compositional authoring style for simple menus and migrations from existing component-based APIs.

Experiencer currently uses a composition-style API with `ContextMenu`, `ContextMenuTrigger`, and `MenuItem`. Requiring an immediate rewrite to data arrays would make adoption slower and riskier.

## Decision

`@popright/react` should support a hybrid authoring model. Compositional children and data-driven items may be mixed in the same menu, and both normalize into the same core item model before opening.

The React package should support:

- a data-driven hook/component API backed directly by `ContextMenuOptions`
- compositional menu children
- data-driven item groups inside composition
- explicit merge behavior when composition and data are both present

Example long-term composition shape:

```tsx
<ContextMenu>
  <ContextMenuTrigger asChild>
    <button>Actions</button>
  </ContextMenuTrigger>

  <ContextMenuContent>
    <ContextMenuHeader>Section</ContextMenuHeader>
    <ContextMenuItem onSelect={edit}>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="danger" onSelect={remove}>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

Example hybrid shape:

```tsx
<ContextMenu items={schemaItems} itemMergeMode="append">
  <ContextMenuTrigger asChild>
    <button>Actions</button>
  </ContextMenuTrigger>

  <ContextMenuContent>
    <ContextMenuHeader>Section</ContextMenuHeader>
    <ContextMenuItem onSelect={edit}>Edit</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItems items={parentItems} />
  </ContextMenuContent>
</ContextMenu>
```

`ContextMenuItems` is the inline bridge for data-driven groups:

```tsx
<ContextMenuItems
  items={[
    { id: "duplicate", label: "Duplicate", onSelect: duplicate },
    { id: "delete", label: "Delete", variant: "danger", onSelect: remove }
  ]}
/>
```

When both top-level `items` and compositional content are provided, `itemMergeMode` controls the result:

- `append`: compositional items first, then data-driven `items`
- `prepend`: data-driven `items` first, then compositional items
- `replace-with-data`: data-driven `items` replace compositional items
- `replace-with-composition`: compositional items replace data-driven `items`

The default should be `append`. That preserves the common shape where static composition provides headers or fixed actions, and dynamic data extends the menu afterward.

## Consequences

The data API remains the core primitive. Composition is an authoring convenience that can include inline data groups. Merge behavior is explicit, so consumers can choose predictable precedence instead of relying on hidden conventions.
