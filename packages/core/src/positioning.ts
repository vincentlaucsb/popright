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

/**
 * Computes final root-menu coordinates inside the viewport.
 *
 * Fixed positioning uses viewport coordinates directly. Absolute positioning
 * converts the same resolved viewport position back into document coordinates
 * by adding scroll offsets.
 */
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

/**
 * Resolves one axis with simple flip-then-clamp behavior.
 *
 * The menu first tries to open at the requested pointer coordinate. If it would
 * overflow and there is room before the pointer, it flips to the opposite side;
 * otherwise it clamps within the padded viewport.
 */
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
