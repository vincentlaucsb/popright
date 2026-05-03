import { describe, expect, it } from "vitest";
import { MenuController } from "../src/MenuController.js";
import type { CloseReason, OpenInput } from "../src/types.js";

interface TestMenu {
  name: string;
  opened: OpenInput[];
  closed: CloseReason[];
  registeredAt: number;
  targetDepth: number;
  hasTargetsValue: boolean;
  triggerType: string;
  openNow(input: OpenInput): void;
  close(reason?: CloseReason): void;
  getTargetDepth(target?: EventTarget | null): number;
  hasTargets(): boolean;
  canOpenFromNativeEvent(event: Event): boolean;
  getClosestTarget(target?: EventTarget | null): Element | undefined;
}

function createTestMenu(name: string, targetDepth = 0): TestMenu {
  return {
    name,
    opened: [],
    closed: [],
    registeredAt: 0,
    targetDepth,
    hasTargetsValue: true,
    triggerType: "contextmenu",
    openNow(input) {
      this.opened.push(input);
    },
    close(reason = "manual") {
      this.closed.push(reason);
    },
    getTargetDepth() {
      return this.targetDepth;
    },
    hasTargets() {
      return this.hasTargetsValue;
    },
    canOpenFromNativeEvent(event) {
      return this.triggerType === event.type;
    },
    getClosestTarget() {
      return undefined;
    }
  };
}

describe("MenuController", () => {
  it("closes the active menu before opening another menu", () => {
    const controller = new MenuController();
    const first = createTestMenu("first");
    const second = createTestMenu("second");

    controller.register(first as never);
    controller.register(second as never);
    controller.requestOpen(first as never, { x: 1, y: 2 });
    controller.requestOpen(second as never, { x: 3, y: 4 });

    expect(first.opened).toHaveLength(1);
    expect(first.closed).toEqual(["reopen"]);
    expect(second.opened).toHaveLength(1);
    expect(controller.activeMenu).toBe(second);
  });

  it("chooses the closest target for the same native event", async () => {
    const controller = new MenuController();
    const outer = createTestMenu("outer", 2);
    const inner = createTestMenu("inner", 0);
    const event = new Event("contextmenu");

    controller.register(outer as never);
    controller.register(inner as never);
    controller.requestOpen(outer as never, { triggerEvent: event });
    controller.requestOpen(inner as never, { triggerEvent: event });
    await Promise.resolve();

    expect(outer.opened).toHaveLength(0);
    expect(inner.opened).toHaveLength(1);
    expect(controller.activeMenu).toBe(inner);
  });

  it("chooses the most recently registered same-depth menu for the same native event", async () => {
    const controller = new MenuController();
    const first = createTestMenu("first", 0);
    const second = createTestMenu("second", 0);
    const event = new Event("contextmenu");

    controller.register(first as never);
    controller.register(second as never);
    controller.requestOpen(first as never, { triggerEvent: event });
    controller.requestOpen(second as never, { triggerEvent: event });
    await Promise.resolve();

    expect(first.opened).toHaveLength(0);
    expect(second.opened).toHaveLength(1);
    expect(controller.activeMenu).toBe(second);
  });

  it("chooses a more specific registered menu even if only the broad target requested first", async () => {
    const controller = new MenuController();
    const body = createTestMenu("body", 4);
    const row = createTestMenu("row", 1);
    const event = new Event("contextmenu");

    controller.register(row as never);
    controller.register(body as never);
    controller.requestOpen(body as never, { triggerEvent: event });
    await Promise.resolve();

    expect(body.opened).toHaveLength(0);
    expect(row.opened).toHaveLength(1);
    expect(controller.activeMenu).toBe(row);
  });
});
