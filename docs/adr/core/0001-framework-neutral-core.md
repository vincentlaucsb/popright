# ADR 0001: Framework-Neutral Core

Date: 2026-05-03

## Status

Accepted

## Context

Popright needs to support React first, but the hard behavior of a context menu is not React-specific: target listeners, positioning, ARIA attributes, focus management, keyboard navigation, item normalization, submenus, and cleanup all belong below framework adapters.

## Decision

Keep `popright` as the source of truth for context menu behavior. Framework adapters should be thin layers that translate framework authoring styles into the core item model and lifecycle.

The core owns:

- menu item data types
- target registration
- open/close lifecycle
- controller arbitration
- viewport collision behavior
- rendered DOM structure
- accessibility attributes
- keyboard and pointer interaction
- theme tokens and class/style override hooks

Adapters own:

- framework idioms
- hooks/components
- ref handling
- composition-to-data translation
- prop forwarding

## Consequences

Behavior stays consistent across adapters. React can grow a compositional API without creating a second menu engine.
