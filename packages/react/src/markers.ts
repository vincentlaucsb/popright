export const COMPONENT_MARKER = Symbol.for("popright.react.component");

export type MarkerKind =
  | "content"
  | "trigger"
  | "item"
  | "items"
  | "separator"
  | "header"
  | "label"
  | "submenu"
  | "submenu-trigger"
  | "submenu-content";

export interface MarkedComponent {
  [COMPONENT_MARKER]?: MarkerKind;
}

export function getMarker(type: unknown): MarkerKind | undefined {
  return (type as MarkedComponent | undefined)?.[COMPONENT_MARKER];
}

export function markComponent<T extends object>(component: T, marker: MarkerKind): T & MarkedComponent {
  (component as T & MarkedComponent)[COMPONENT_MARKER] = marker;
  return component;
}
