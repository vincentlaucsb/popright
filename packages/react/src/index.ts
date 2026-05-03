import type { ContextMenuOptions, OpenInput } from "@popright/core";
import type * as React from "react";

export interface UseContextMenuReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefCallback<T>;
  open: (input: OpenInput) => void;
  close: () => void;
  update: (options: Partial<ContextMenuOptions>) => void;
}

export function useContextMenu<T extends HTMLElement = HTMLElement>(
  _options: ContextMenuOptions
): UseContextMenuReturn<T> {
  throw new Error("@popright/react is scaffolded; React behavior is planned for Phase 5.");
}

export interface ContextMenuProps extends ContextMenuOptions {
  children: React.ReactElement;
}

export function ContextMenu(_props: ContextMenuProps): React.ReactElement {
  throw new Error("@popright/react is scaffolded; React behavior is planned for Phase 5.");
}
