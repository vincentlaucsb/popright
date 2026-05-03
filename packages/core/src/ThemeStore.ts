import { BUILT_IN_THEME } from "./constants.js";
import { cloneTheme, normalizeThemeInput } from "./theme-utils.js";
import type { ContextMenuTheme, ContextMenuThemeInput, ContextMenuThemeStore } from "./types.js";

/**
 * Framework-agnostic global theme store used by every open menu.
 *
 * The store never exposes its internal theme object directly. Callers always
 * receive a clone so an accidental mutation cannot silently change future menu
 * renders without notifying subscribers.
 */
export class ThemeStore implements ContextMenuThemeStore {
  /** Current normalized global theme; cloned on every read and notification. */
  #theme = BUILT_IN_THEME;

  /** Open menus subscribe while mounted so theme changes can update live DOM. */
  #listeners = new Set<(theme: ContextMenuTheme) => void>();

  /** Returns a defensive copy of the current normalized theme. */
  get(): ContextMenuTheme {
    return cloneTheme(this.#theme);
  }

  /** Normalizes string, object, or store input before notifying live menus. */
  set(theme: ContextMenuThemeInput): void {
    this.#theme = normalizeThemeInput(theme, this.#theme);
    this.#emit();
  }

  /** Applies an atomic update against a cloned snapshot of the current theme. */
  update(updater: (theme: ContextMenuTheme) => ContextMenuTheme): void {
    this.set(updater(this.get()));
  }

  /**
   * Subscribes to future theme changes and immediately sends the current value.
   * Immediate delivery lets open menus share one update path for initial mount
   * and later global theme changes.
   */
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
