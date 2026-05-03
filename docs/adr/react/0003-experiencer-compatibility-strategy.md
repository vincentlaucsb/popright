# ADR 0003: Experiencer Compatibility Strategy

Date: 2026-05-03

## Status

Accepted

## Context

Experiencer should be able to adopt Popright quickly. Its current custom context menu uses a component API:

```tsx
<ContextMenu id="resume-menu">
  <h3>Header</h3>
  <MenuItem onClick={edit}>Edit</MenuItem>
</ContextMenu>

<ContextMenuTrigger id="resume-menu">...</ContextMenuTrigger>
```

The long-term Popright API should avoid ID-based wiring, but Experiencer needs a low-risk migration path.

## Decision

Support a compatibility adapter in Experiencer or a clearly marked compatibility layer that translates the existing component API into Popright data.

The compatibility layer may preserve these names:

- `ContextMenu`
- `ContextMenuTrigger`
- `MenuItem`

It should translate:

- `h3` to `header`
- `hr` to `separator`
- `MenuItem` to action items

It should preserve callback order, especially `ContextMenuTrigger` calling `onContextMenu` before opening, because Experiencer uses that callback to select the node whose menu is being opened.

## Consequences

Experiencer can migrate first and clean up later. The compatibility layer should not become the preferred Popright API.
