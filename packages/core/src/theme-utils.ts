import { BUILT_IN_THEME } from "./constants.js";
import type { ContextMenuTheme, ContextMenuThemeInput } from "./types.js";

export function normalizeThemeInput(
  input: ContextMenuThemeInput | undefined,
  fallback: ContextMenuTheme = BUILT_IN_THEME
): ContextMenuTheme {
  if (!input) {
    return cloneTheme(fallback);
  }
  if (typeof input === "string") {
    return { ...cloneTheme(fallback), mode: input === "system" ? "automatic" : input };
  }
  if (isThemeStoreInput(input)) {
    return normalizeThemeInput(input.get(), fallback);
  }
  return {
    ...cloneTheme(fallback),
    ...input,
    classes: { ...fallback.classes, ...input.classes },
    styles: { ...fallback.styles, ...input.styles },
    tokens: { ...fallback.tokens, ...input.tokens }
  };
}

function isThemeStoreInput(input: Exclude<ContextMenuThemeInput, string>): input is Extract<ContextMenuThemeInput, { get(): ContextMenuTheme }> {
  return "get" in input && typeof input.get === "function";
}

export function cloneTheme(theme: ContextMenuTheme): ContextMenuTheme {
  return {
    ...theme,
    classes: { ...theme.classes },
    styles: { ...theme.styles },
    tokens: { ...theme.tokens }
  };
}
