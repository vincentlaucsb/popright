import * as React from "react";
import { markComponent } from "./markers.js";
import { composeRefs, getElementRef } from "./refs.js";
import {
  collectContent,
  composeContextMenuOptions,
  composeDropdownMenuOptions,
  findTriggerElement,
  hasStructuredChildren
} from "./compose.js";
import { useContextMenu, useDropdownMenu } from "./hook.js";
import type {
  ContextMenuContentProps,
  ContextMenuHeaderProps,
  ContextMenuItemProps,
  ContextMenuItemsProps,
  ContextMenuLabelProps,
  ContextMenuRootProps,
  ContextMenuSeparatorProps,
  ContextMenuSubmenuContentProps,
  ContextMenuSubmenuProps,
  ContextMenuSubmenuTriggerProps,
  ContextMenuTriggerProps,
  DropdownMenuRootProps
} from "./types.js";

/**
 * Component wrapper for both Popright React styles:
 *
 * - Simple mode: `<ContextMenu items={...}><button /></ContextMenu>`
 * - Structured mode: Trigger/Content/Item child components that compile to the
 *   same data-driven core options.
 *
 * The component still delegates all menu DOM and behavior to `useContextMenu`.
 */
export function ContextMenu({ children, ...props }: ContextMenuRootProps): React.ReactElement {
  const structured = hasStructuredChildren(children);
  const triggerElement = structured ? findTriggerElement(children) : null;
  const triggerProps = triggerElement?.props as ContextMenuTriggerProps | undefined;
  const options = structured
    ? composeContextMenuOptions({
        children,
        ...props,
        context: triggerProps?.context,
        trigger: triggerProps?.disabled ? "manual" : props.trigger
      })
    : (props as ContextMenuRootProps & { items: NonNullable<ContextMenuRootProps["items"]> });
  const menu = useContextMenu(options);

  if (!structured) {
    const child = React.Children.only(children) as React.ReactElement;
    return cloneWithRef(child, menu.ref);
  }

  if (!triggerElement) {
    return <>{children}</>;
  }

  const triggerChild = triggerProps!.children;
  if (triggerProps!.asChild && React.isValidElement(triggerChild)) {
    const childProps = triggerChild.props as { onContextMenu?: React.MouseEventHandler<Element> };
    return cloneWithRef(triggerChild, menu.ref, {
      onContextMenu: composeEventHandlers(childProps.onContextMenu, triggerProps!.onContextMenu),
      "data-popright-trigger-context": triggerProps!.context === undefined ? undefined : ""
    });
  }

  return (
    <span ref={menu.ref} onContextMenu={triggerProps!.onContextMenu as React.MouseEventHandler<HTMLSpanElement>}>
      {triggerProps!.children}
    </span>
  );
}

export function DropdownMenu({ children, ...props }: DropdownMenuRootProps): React.ReactElement {
  const structured = hasStructuredChildren(children);
  const triggerElement = structured ? findTriggerElement(children) : null;
  const triggerProps = triggerElement?.props as ContextMenuTriggerProps | undefined;
  const options = structured
    ? composeDropdownMenuOptions({
        children,
        ...props,
        context: triggerProps?.context,
        trigger: triggerProps?.disabled ? "manual" : props.trigger
      })
    : (props as DropdownMenuRootProps & { items: NonNullable<DropdownMenuRootProps["items"]> });
  const menu = useDropdownMenu(options);

  if (!structured) {
    const child = React.Children.only(children) as React.ReactElement;
    return cloneWithRef(child, menu.ref);
  }

  if (!triggerElement) {
    return <>{children}</>;
  }

  const triggerChild = triggerProps!.children;
  if (triggerProps!.asChild && React.isValidElement(triggerChild)) {
    const childProps = triggerChild.props as { onClick?: React.MouseEventHandler<Element> };
    return cloneWithRef(triggerChild, menu.ref, {
      onClick: composeEventHandlers(childProps.onClick, triggerProps!.onClick),
      "data-popright-trigger-dropdown": triggerProps!.context === undefined ? undefined : ""
    });
  }

  return (
    <span ref={menu.ref} onClick={triggerProps!.onClick as React.MouseEventHandler<HTMLSpanElement>}>
      {triggerProps!.children}
    </span>
  );
}

export const ContextMenuTrigger = markComponent(function ContextMenuTrigger({
  asChild: _asChild,
  children
}: ContextMenuTriggerProps): React.ReactElement | null {
  return React.isValidElement(children) ? children : <>{children}</>;
}, "trigger");

export const ContextMenuContent = markComponent(function ContextMenuContent(
  _props: ContextMenuContentProps
): null {
  return null;
}, "content");

export const ContextMenuItem = markComponent(function ContextMenuItem(_props: ContextMenuItemProps): null {
  return null;
}, "item");

export const ContextMenuItems = markComponent(function ContextMenuItems(_props: ContextMenuItemsProps): null {
  return null;
}, "items");

export const ContextMenuSeparator = markComponent(function ContextMenuSeparator(
  _props: ContextMenuSeparatorProps
): null {
  return null;
}, "separator");

export const ContextMenuHeader = markComponent(function ContextMenuHeader(_props: ContextMenuHeaderProps): null {
  return null;
}, "header");

export const ContextMenuLabel = markComponent(function ContextMenuLabel(_props: ContextMenuLabelProps): null {
  return null;
}, "label");

export const ContextMenuSubmenu = markComponent(function ContextMenuSubmenu(_props: ContextMenuSubmenuProps): null {
  return null;
}, "submenu");

export const ContextMenuSubmenuTrigger = markComponent(function ContextMenuSubmenuTrigger(
  _props: ContextMenuSubmenuTriggerProps
): null {
  return null;
}, "submenu-trigger");

export const ContextMenuSubmenuContent = markComponent(function ContextMenuSubmenuContent(
  _props: ContextMenuSubmenuContentProps
): null {
  return null;
}, "submenu-content");

function cloneWithRef<T extends HTMLElement>(
  child: React.ReactElement,
  ref: React.Ref<T>,
  props: Record<string, unknown> = {}
): React.ReactElement {
  /** User refs and Popright's target ref must both observe the same DOM node. */
  const childRef = getElementRef<T>(child);
  return React.cloneElement(child, {
    ...props,
    ref: composeRefs(childRef, ref)
  } as React.Attributes);
}

function composeEventHandlers<T extends Element>(
  first?: React.MouseEventHandler<T>,
  second?: React.MouseEventHandler<T>
): React.MouseEventHandler<T> | undefined {
  if (!first && !second) {
    return undefined;
  }
  return (event) => {
    /** User handlers run first so applications can observe the native event. */
    first?.(event);
    second?.(event);
  };
}

export function __collectContextMenuItemsForTests(children: React.ReactNode) {
  return collectContent(children).items;
}
