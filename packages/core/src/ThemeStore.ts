import { BUILT_IN_THEME } from "./constants.js";
import { cloneTheme, normalizeThemeInput } from "./theme-utils.js";
import type { ContextMenuTheme, ContextMenuThemeInput, ContextMenuThemeStore } from "./types.js";

export class ThemeStore implements ContextMenuThemeStore {
  #theme = BUILT_IN_THEME;
  #listeners = new Set<(theme: ContextMenuTheme) => void>();

  get(): ContextMenuTheme {
    return cloneTheme(this.#theme);
  }

  set(theme: ContextMenuThemeInput): void {
    this.#theme = normalizeThemeInput(theme, this.#theme);
    this.#emit();
  }

  update(updater: (theme: ContextMenuTheme) => ContextMenuTheme): void {
    this.set(updater(this.get()));
  }

  subscribe(listener: (theme: ContextMenuTheme) => void): () => void {
    this.#listeners.add(listener);
    listener(this.get());
    return () => this.#listeners.delete(listener);
  }

  #emit(): void {
    const theme = this.get();
    for (const listener of this.#listeners) {
      listener(theme);
    }
  }
}

export const contextMenuTheme = new ThemeStore();
