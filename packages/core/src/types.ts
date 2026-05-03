export type CloseReason =
  | "select"
  | "escape"
  | "outside-pointer"
  | "blur"
  | "scroll"
  | "resize"
  | "manual"
  | "destroy"
  | "reopen";

export interface OpenInput {
  x?: number;
  y?: number;
  target?: Element;
  triggerEvent?: Event;
  context?: unknown;
}

export interface MenuContext {
  triggerEvent?: Event;
  target?: Element;
  x?: number;
  y?: number;
  data?: unknown;
}

export interface ContextMenuInstance {
  open(input?: OpenInput): void;
  close(reason?: CloseReason): void;
  update(options: Partial<ContextMenuOptions>): void;
  destroy(): void;
  readonly isOpen: boolean;
  readonly root: HTMLElement | null;
}

export interface ContextMenuOptions {
  items: MenuItemsInput;
  onSelect?: (event: MenuSelectEvent) => void;
  onOpen?: (event: MenuOpenEvent) => void;
  onClose?: (event: MenuCloseEvent) => void;
  onBeforeOpen?: (event: MenuBeforeOpenEvent) => boolean | void;
  trigger?: "contextmenu" | "click" | "manual";
  placement?: "cursor" | "target";
  strategy?: "fixed" | "absolute";
  closeOnSelect?: boolean;
  closeOnBlur?: boolean;
  closeOnEscape?: boolean;
  closeOnScroll?: boolean;
  closeOnResize?: boolean;
  modal?: boolean;
  collisionPadding?: number;
  maxHeight?: number | string;
  minWidth?: number | string;
  zIndex?: number;
  className?: string;
  classes?: ContextMenuClassNames;
  styles?: ContextMenuStyles;
  theme?: ContextMenuThemeInput;
  portal?: Element | false;
  dir?: "ltr" | "rtl";
}

export type NormalizedContextMenuOptions = Required<
  Pick<
    ContextMenuOptions,
    | "trigger"
    | "placement"
    | "strategy"
    | "closeOnSelect"
    | "closeOnBlur"
    | "closeOnEscape"
    | "closeOnScroll"
    | "closeOnResize"
    | "modal"
    | "collisionPadding"
  >
> &
  Omit<
    ContextMenuOptions,
    | "trigger"
    | "placement"
    | "strategy"
    | "closeOnSelect"
    | "closeOnBlur"
    | "closeOnEscape"
    | "closeOnScroll"
    | "closeOnResize"
    | "modal"
    | "collisionPadding"
  >;

export interface ContextMenuClassNames {
  menu?: string;
  item?: string;
  itemActive?: string;
  itemDisabled?: string;
  itemDanger?: string;
  separator?: string;
  header?: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  submenu?: string;
  submenuTrigger?: string;
}

export interface ContextMenuStyles {
  menu?: Partial<CSSStyleDeclaration>;
  item?: Partial<CSSStyleDeclaration>;
  itemActive?: Partial<CSSStyleDeclaration>;
  itemDisabled?: Partial<CSSStyleDeclaration>;
  itemDanger?: Partial<CSSStyleDeclaration>;
  separator?: Partial<CSSStyleDeclaration>;
  header?: Partial<CSSStyleDeclaration>;
  label?: Partial<CSSStyleDeclaration>;
  icon?: Partial<CSSStyleDeclaration>;
  shortcut?: Partial<CSSStyleDeclaration>;
}

export type ContextMenuThemeInput =
  | "light"
  | "dark"
  | "system"
  | ContextMenuTheme
  | ContextMenuThemeStore;

export interface ContextMenuTheme {
  mode: "light" | "dark" | "system";
  className?: string;
  classes?: ContextMenuClassNames;
  styles?: ContextMenuStyles;
  tokens?: Partial<ContextMenuThemeTokens>;
}

export interface ContextMenuThemeTokens {
  bg: string;
  color: string;
  border: string;
  shadow: string;
  radius: string;
  padding: string;
  itemHeight: string;
  itemGap: string;
  activeBg: string;
  disabledColor: string;
  dangerColor: string;
  zIndex: string | number;
}

export interface ContextMenuThemeStore {
  get(): ContextMenuTheme;
  set(theme: ContextMenuThemeInput): void;
  update(updater: (theme: ContextMenuTheme) => ContextMenuTheme): void;
  subscribe(listener: (theme: ContextMenuTheme) => void): () => void;
}

export type MenuItemsInput = MenuItem[] | ((context: MenuContext) => MenuItem[]);

export type MenuItem =
  | MenuActionItem
  | MenuSeparatorItem
  | MenuHeaderItem
  | MenuLabelItem
  | MenuCheckboxItem
  | MenuRadioItem
  | MenuSubmenuItem;

export type MenuSelectableItem = MenuActionItem | MenuCheckboxItem | MenuRadioItem | MenuSubmenuItem;
export type MenuChildItem =
  | MenuActionItem
  | MenuSeparatorItem
  | MenuHeaderItem
  | MenuLabelItem
  | MenuCheckboxItem
  | MenuRadioItem;
export type MenuChildItemsInput = MenuChildItem[] | ((context: MenuContext) => MenuChildItem[]);

export interface MenuActionItem {
  type?: "item";
  id: string;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
  variant?: "default" | "danger";
  shortcut?: string;
  icon?: MenuIcon;
  description?: string;
  className?: string;
  classes?: Partial<ContextMenuClassNames>;
  style?: Partial<CSSStyleDeclaration>;
  value?: unknown;
  onSelect?: (event: MenuSelectEvent) => void;
}

export interface MenuSeparatorItem {
  type: "separator";
  hidden?: boolean;
}

export interface MenuHeaderItem {
  type: "header";
  label: string;
  align?: "left" | "right" | "items";
  hidden?: boolean;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
}

export interface MenuLabelItem {
  type: "label";
  label: string;
  hidden?: boolean;
}

export interface MenuCheckboxItem {
  type: "checkbox";
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  shortcut?: string;
  onCheckedChange?: (checked: boolean, event: MenuSelectEvent) => void;
}

export interface MenuRadioItem {
  type: "radio";
  id: string;
  label: string;
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
}

export interface MenuSubmenuItem {
  type: "submenu";
  id: string;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
  shortcut?: string;
  icon?: MenuIcon;
  description?: string;
  className?: string;
  classes?: Partial<ContextMenuClassNames>;
  style?: Partial<CSSStyleDeclaration>;
  value?: unknown;
  items: MenuChildItemsInput;
}

export type MenuIcon = string | HTMLElement | ((context: MenuRenderContext) => Node | string);

export interface MenuRenderContext {
  item: MenuItem;
  context: MenuContext;
}

export interface MenuSelectEvent {
  id: string;
  item: MenuSelectableItem;
  nativeEvent: Event;
  context: MenuContext;
  close: () => void;
  preventClose: () => void;
}

export interface MenuOpenEvent {
  context: MenuContext;
  root: HTMLElement;
}

export interface MenuCloseEvent {
  reason: CloseReason;
  nativeEvent?: Event;
}

export interface MenuBeforeOpenEvent {
  context: MenuContext;
}
