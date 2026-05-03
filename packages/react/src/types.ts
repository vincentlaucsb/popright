import type {
  ContextMenuOptions,
  MenuActionItem,
  MenuChildItem,
  MenuChildItemsInput,
  MenuHeaderItem,
  MenuItem,
  MenuLabelItem,
  MenuSelectEvent,
  MenuSeparatorItem,
  MenuSubmenuItem,
  OpenInput
} from "popright";
import type * as React from "react";

export type ItemMergeMode = "append" | "prepend" | "replace-with-data" | "replace-with-composition";

export interface UseContextMenuReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefCallback<T>;
  open: (input: OpenInput) => void;
  close: () => void;
  update: (options: Partial<ContextMenuOptions>) => void;
}

export interface ContextMenuRootProps extends Omit<ContextMenuOptions, "items"> {
  children: React.ReactNode;
  items?: ContextMenuOptions["items"];
  itemMergeMode?: ItemMergeMode;
}

export interface ContextMenuTriggerProps<T extends HTMLElement = HTMLElement> {
  asChild?: boolean;
  children?: React.ReactElement;
  context?: unknown;
  disabled?: boolean;
  onContextMenu?: React.MouseEventHandler<T>;
}

export interface ContextMenuContentProps {
  children?: React.ReactNode;
  id?: string;
}

export interface ContextMenuItemProps
  extends Omit<MenuActionItem, "id" | "label" | "onSelect" | "type"> {
  children: React.ReactNode;
  id?: string;
  onSelect?: (event: MenuSelectEvent) => void;
}

export interface ContextMenuItemsProps {
  items: MenuItem[];
}

export type ContextMenuSeparatorProps = Omit<MenuSeparatorItem, "type">;

export interface ContextMenuHeaderProps extends Omit<MenuHeaderItem, "type" | "label"> {
  children: React.ReactNode;
}

export interface ContextMenuLabelProps extends Omit<MenuLabelItem, "type" | "label"> {
  children: React.ReactNode;
}

export interface ContextMenuSubmenuProps
  extends Omit<MenuSubmenuItem, "type" | "id" | "label" | "items"> {
  children: React.ReactNode;
  id?: string;
}

export interface ContextMenuSubmenuTriggerProps {
  children: React.ReactNode;
}

export interface ContextMenuSubmenuContentProps {
  children?: React.ReactNode;
  items?: MenuChildItemsInput;
}

export type ComposedItem = MenuItem;
export type ComposedChildItem = MenuChildItem;
