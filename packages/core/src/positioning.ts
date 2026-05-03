export interface MenuPositionInput {
  preferredLeft: number;
  preferredTop: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  padding: number;
  strategy: "fixed" | "absolute";
  scrollX?: number;
  scrollY?: number;
}

export interface MenuPosition {
  left: number;
  top: number;
}

export function computeMenuPosition(input: MenuPositionInput): MenuPosition {
  const padding = Math.max(0, input.padding);
  const left = resolveAxisPosition(input.preferredLeft, input.width, input.viewportWidth, padding);
  const top = resolveAxisPosition(input.preferredTop, input.height, input.viewportHeight, padding);

  if (input.strategy === "absolute") {
    return {
      left: left + (input.scrollX ?? 0),
      top: top + (input.scrollY ?? 0)
    };
  }

  return { left, top };
}

export function resolveAxisPosition(
  preferredStart: number,
  size: number,
  viewportSize: number,
  padding: number
): number {
  const min = padding;
  const max = Math.max(padding, viewportSize - padding - size);
  if (preferredStart + size > viewportSize - padding && preferredStart - size >= padding) {
    return preferredStart - size;
  }
  return Math.min(Math.max(preferredStart, min), max);
}
