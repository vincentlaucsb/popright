import { createContextMenu } from "@popright/core";
import type { ContextMenuInstance, ContextMenuOptions, OpenInput } from "@popright/core";
import * as React from "react";

export interface UseContextMenuReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefCallback<T>;
  open: (input: OpenInput) => void;
  close: () => void;
  update: (options: Partial<ContextMenuOptions>) => void;
}

export function useContextMenu<T extends HTMLElement = HTMLElement>(
  options: ContextMenuOptions
): UseContextMenuReturn<T> {
  const optionsRef = React.useRef(options);
  const nodeRef = React.useRef<T | null>(null);
  const instanceRef = React.useRef<ContextMenuInstance | null>(null);

  optionsRef.current = options;

  const destroyInstance = React.useCallback(() => {
    instanceRef.current?.destroy();
    instanceRef.current = null;
  }, []);

  const ensureManualInstance = React.useCallback(() => {
    if (!instanceRef.current) {
      instanceRef.current = createContextMenu(optionsRef.current);
    }
    return instanceRef.current;
  }, []);

  const ref = React.useCallback(
    (node: T | null) => {
      if (nodeRef.current === node) {
        return;
      }

      destroyInstance();
      nodeRef.current = node;

      if (node) {
        instanceRef.current = createContextMenu(node, optionsRef.current);
      }
    },
    [destroyInstance]
  );

  React.useEffect(() => {
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

  const update = React.useCallback((nextOptions: Partial<ContextMenuOptions>) => {
    instanceRef.current?.update(nextOptions);
  }, []);

  return { ref, open, close, update };
}

export interface ContextMenuProps extends ContextMenuOptions {
  children: React.ReactElement;
}

export function ContextMenu({ children, ...options }: ContextMenuProps): React.ReactElement {
  const contextMenu = useContextMenu(options);
  const childRef = getElementRef(children);

  return React.cloneElement(children, {
    ref: composeRefs(childRef, contextMenu.ref)
  } as React.Attributes);
}

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    }
  };
}

function getElementRef<T>(element: React.ReactElement): React.Ref<T> | undefined {
  return (element as React.ReactElement & { ref?: React.Ref<T> }).ref;
}
