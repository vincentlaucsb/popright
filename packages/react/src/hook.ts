import { createContextMenu, createDropdownMenu } from "popright";
import type { ContextMenuInstance, ContextMenuOptions, DropdownMenuOptions, OpenInput } from "popright";
import * as React from "react";
import type { UseContextMenuReturn } from "./types.js";

/**
 * React lifecycle adapter around the framework-agnostic core menu.
 *
 * The hook deliberately lets core own the menu DOM. React only owns target
 * attachment, option updates, and cleanup so framework behavior stays thin.
 */
export function useContextMenu<T extends HTMLElement = HTMLElement>(
  options: ContextMenuOptions
): UseContextMenuReturn<T, ContextMenuOptions> {
  return useCoreMenu(options, createContextMenu);
}

export function useDropdownMenu<T extends HTMLElement = HTMLElement>(
  options: DropdownMenuOptions
): UseContextMenuReturn<T, DropdownMenuOptions> {
  return useCoreMenu(options, createDropdownMenu);
}

function useCoreMenu<T extends HTMLElement, TOptions extends ContextMenuOptions | DropdownMenuOptions>(
  options: TOptions,
  createMenu: {
    (target: Element | Document | Window | Iterable<Element>, options: TOptions): ContextMenuInstance;
    (options: TOptions): ContextMenuInstance;
  }
): UseContextMenuReturn<T, TOptions> {
  /**
   * Latest options are kept outside React render identity so stable callbacks
   * can create manual instances without closing over stale menu data.
   */
  const optionsRef = React.useRef(options);

  /** Current target node attached by the callback ref. */
  const nodeRef = React.useRef<T | null>(null);

  /** The one core instance owned by this hook, whether target-bound or manual. */
  const instanceRef = React.useRef<ContextMenuInstance | null>(null);

  optionsRef.current = options;

  const destroyInstance = React.useCallback(() => {
    instanceRef.current?.destroy();
    instanceRef.current = null;
  }, []);

  const ensureManualInstance = React.useCallback(() => {
    if (!instanceRef.current) {
      instanceRef.current = createMenu(optionsRef.current);
    }
    return instanceRef.current;
  }, []);

  const ref = React.useCallback(
    (node: T | null) => {
      if (nodeRef.current === node) {
        return;
      }

      /**
       * A callback ref can move between real DOM nodes. Core target listeners
       * are bound to the old node, so a node change must destroy and recreate
       * the instance rather than only updating options.
       */
      destroyInstance();
      nodeRef.current = node;

      if (node) {
        instanceRef.current = createMenu(node, optionsRef.current);
      }
    },
    [destroyInstance]
  );

  React.useEffect(() => {
    /** Keeps dynamic callbacks fresh without recreating target listeners. */
    instanceRef.current?.update(options);
  }, [options]);

  React.useEffect(() => destroyInstance, [destroyInstance]);

  const open = React.useCallback(
    (input: OpenInput) => {
      ensureManualInstance().open(input);
    },
    [ensureManualInstance]
  );

  const close = React.useCallback(() => {
    instanceRef.current?.close();
  }, []);

  const update = React.useCallback((nextOptions: Partial<TOptions>) => {
    instanceRef.current?.update(nextOptions);
  }, []);

  return { ref, open, close, update };
}
