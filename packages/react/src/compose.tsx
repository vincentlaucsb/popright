import type { ContextMenuOptions, MenuChildItem, MenuItem } from "popright";
import * as React from "react";
import { getMarker } from "./markers.js";
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
  ItemMergeMode
} from "./types.js";

export interface CompositionResult {
  contentId?: string;
  items: MenuItem[];
}

export function composeContextMenuOptions(props: ContextMenuRootProps): ContextMenuOptions {
  const { children, items, itemMergeMode = "append", ...options } = props;
  const composition = collectContent(children);
  const composedItems = composition.items;
  const mergedItems = mergeItems(items, composedItems, itemMergeMode);

  return {
    ...options,
    id: composition.contentId ?? options.id,
    items: mergedItems
  };
}

export function collectContent(children: React.ReactNode): CompositionResult {
  const content = findContentElement(children);
  if (!content) {
    return { items: [] };
  }

  const props = content.props as ContextMenuContentProps;
  return {
    contentId: props.id,
    items: collectItems(props.children)
  };
}

export function hasStructuredChildren(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && ["trigger", "content"].includes(getMarker(child.type) ?? "")
  );
}

export function findTriggerElement(children: React.ReactNode): React.ReactElement | null {
  for (const child of React.Children.toArray(children)) {
    if (React.isValidElement(child) && getMarker(child.type) === "trigger") {
      return child;
    }
  }
  return null;
}

function findContentElement(children: React.ReactNode): React.ReactElement | null {
  for (const child of React.Children.toArray(children)) {
    if (React.isValidElement(child) && getMarker(child.type) === "content") {
      return child;
    }
  }
  return null;
}

function mergeItems(
  dataItems: ContextMenuRootProps["items"],
  composedItems: MenuItem[],
  mode: ItemMergeMode
): ContextMenuOptions["items"] {
  if (!dataItems) {
    return composedItems;
  }

  if (mode === "replace-with-data") {
    return dataItems;
  }
  if (mode === "replace-with-composition") {
    return composedItems;
  }

  if (typeof dataItems === "function") {
    return (context) => {
      const resolved = dataItems(context);
      return mode === "prepend" ? [...resolved, ...composedItems] : [...composedItems, ...resolved];
    };
  }

  return mode === "prepend" ? [...dataItems, ...composedItems] : [...composedItems, ...dataItems];
}

function collectItems(children: React.ReactNode): MenuItem[] {
  return collectItemsInternal(children).filter((item): item is MenuItem => item !== null);
}

function collectChildItems(children: React.ReactNode): MenuChildItem[] {
  return collectItemsInternal(children).filter((item): item is MenuChildItem => item !== null && item.type !== "submenu");
}

function collectItemsInternal(children: React.ReactNode): Array<MenuItem | null> {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) {
      return [];
    }

    const marker = getMarker(child.type);
    if (!marker) {
      if (child.type === React.Fragment) {
        return collectItemsInternal((child.props as { children?: React.ReactNode }).children);
      }
      return [];
    }

    if (marker === "item") {
      return [createItem(child.props as ContextMenuItemProps)];
    }
    if (marker === "items") {
      return [...(child.props as ContextMenuItemsProps).items];
    }
    if (marker === "separator") {
      return [{ type: "separator", ...(child.props as ContextMenuSeparatorProps) }];
    }
    if (marker === "header") {
      const props = child.props as ContextMenuHeaderProps;
      return [{ type: "header", label: nodeToLabel(props.children), ...withoutChildren(props) }];
    }
    if (marker === "label") {
      const props = child.props as ContextMenuLabelProps;
      return [{ type: "label", label: nodeToLabel(props.children), hidden: props.hidden }];
    }
    if (marker === "submenu") {
      return [createSubmenu(child.props as ContextMenuSubmenuProps)];
    }

    return [];
  });
}

function createItem(props: ContextMenuItemProps): MenuItem {
  const { children, id, ...item } = props;
  const label = nodeToLabel(children);
  return {
    ...item,
    id: id ?? makeId(label),
    label
  };
}

function createSubmenu(props: ContextMenuSubmenuProps): MenuItem {
  const { children, id, ...item } = props;
  const trigger = findMarkedChild<ContextMenuSubmenuTriggerProps>(children, "submenu-trigger");
  const content = findMarkedChild<ContextMenuSubmenuContentProps>(children, "submenu-content");
  const label = nodeToLabel(trigger?.props.children);
  const contentProps = content?.props;
  return {
    ...item,
    type: "submenu",
    id: id ?? makeId(label),
    label,
    items: contentProps?.items ?? collectChildItems(contentProps?.children)
  };
}

function findMarkedChild<T>(children: React.ReactNode, marker: string): React.ReactElement<T> | null {
  for (const child of React.Children.toArray(children)) {
    if (React.isValidElement<T>(child) && getMarker(child.type) === marker) {
      return child;
    }
  }
  return null;
}

function nodeToLabel(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  return React.Children.toArray(node)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("")
    .trim();
}

function makeId(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function withoutChildren<T extends { children: React.ReactNode }>(props: T): Omit<T, "children"> {
  const { children: _children, ...rest } = props;
  return rest;
}
