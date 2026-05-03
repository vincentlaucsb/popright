# Agent Notes

## Temporary Plans

Use `.temp/` for temporary working plans, migration notes, scratch checklists, and other short-lived coordination documents that should not be committed. The folder is intentionally ignored by git.

Keep durable project documentation in tracked files such as `README.md`, `DESIGN.md`, or focused docs that are meant to survive beyond the current task.

## Comments

Write comments as if future maintainers are smart but busy. Do not explain what the next line of code already says. Explain why a decision exists, what invariant must not be broken, and what browser or lifecycle edge case made the code take its shape.

Good comments:

- Document critical invariants, especially controller ownership, focus restoration, global listeners, same-event menu arbitration, submenu parent/child relationships, and package boundary assumptions.
- Explain surprising ordering, such as why candidate opens are delayed to a microtask or why a menu is measured while hidden.
- Name non-obvious tradeoffs, such as closing on scroll/resize instead of repositioning.
- Use JSDoc for exported classes, exported functions, public types, and private fields whose purpose is architectural rather than local.

Bad comments:

- Do not narrate obvious assignments, branches, or type names.
- Do not restate TypeScript annotations in prose.
- Do not leave comments that defend dead code, stale plans, or temporary hacks.
- Do not comment every private field by habit; comment private state only when it preserves a lifecycle rule or invariant.

When in doubt, delete the comment if the code can be renamed or reshaped to make the same idea obvious. Keep the comment when removing it would erase context that cannot be recovered from the code alone.
