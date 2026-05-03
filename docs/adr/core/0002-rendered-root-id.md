# ADR 0002: Rendered Root ID

Date: 2026-05-03

## Status

Accepted

## Context

React consumers may need to preserve targeted styles and tests during migration from existing context menu implementations. Experiencer, for example, has menu IDs that may be referenced by CSS or tests.

## Decision

`popright` supports an optional `id` in `ContextMenuOptions`. If present, it is rendered onto the menu root element.

The core must treat `id` as a DOM attribute only. It must not use `id` for registration, trigger matching, controller arbitration, opening, or closing.

## Consequences

Framework adapters can forward IDs for styling and compatibility without changing Popright's behavior model.
