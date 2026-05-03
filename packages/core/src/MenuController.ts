import type { ContextMenu } from "./ContextMenu.js";
import type { CloseReason, OpenInput } from "./types.js";

interface OpenCandidate {
  menu: ContextMenu;
  input: OpenInput;
  targetDepth: number;
  registeredAt: number;
}

export class MenuController {
  #menus = new Set<ContextMenu>();
  #activeMenu: ContextMenu | null = null;
  #registeredCounter = 0;
  #eventCandidates = new WeakMap<Event, OpenCandidate[]>();

  register(menu: ContextMenu): void {
    this.#menus.add(menu);
    menu.registeredAt = ++this.#registeredCounter;
  }

  unregister(menu: ContextMenu): void {
    this.#menus.delete(menu);
    if (this.#activeMenu === menu) {
      this.#activeMenu = null;
    }
  }

  requestOpen(menu: ContextMenu, input: OpenInput): void {
    const event = input.triggerEvent;
    if (!event) {
      this.#open(menu, input);
      return;
    }

    const targetDepth = menu.getTargetDepth(event.target);
    if (targetDepth === -1 && menu.hasTargets()) {
      return;
    }

    let group = this.#eventCandidates.get(event);
    if (!group) {
      group = [];
      this.#eventCandidates.set(event, group);
      queueMicrotask(() => {
        const candidates = this.#eventCandidates.get(event);
        this.#eventCandidates.delete(event);
        if (!candidates || candidates.length === 0) {
          return;
        }
        const winner = chooseCandidate(candidates);
        this.#open(winner.menu, winner.input);
      });
    }

    group.push({
      menu,
      input,
      targetDepth,
      registeredAt: menu.registeredAt
    });
  }

  closeActive(reason: CloseReason = "manual", nativeEvent?: Event): void {
    this.#activeMenu?.close(reason, nativeEvent);
  }

  setActive(menu: ContextMenu): void {
    if (this.#activeMenu && this.#activeMenu !== menu) {
      this.#activeMenu.close("reopen");
    }
    this.#activeMenu = menu;
  }

  clearActive(menu: ContextMenu): void {
    if (this.#activeMenu === menu) {
      this.#activeMenu = null;
    }
  }

  get activeMenu(): ContextMenu | null {
    return this.#activeMenu;
  }

  #open(menu: ContextMenu, input: OpenInput): void {
    this.setActive(menu);
    menu.openNow(input);
  }
}

function chooseCandidate(candidates: OpenCandidate[]): OpenCandidate {
  return [...candidates].sort((a, b) => {
    if (a.targetDepth !== b.targetDepth) {
      return a.targetDepth - b.targetDepth;
    }
    return b.registeredAt - a.registeredAt;
  })[0];
}
