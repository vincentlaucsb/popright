import { describe, expect, it } from "vitest";
import { MenuController } from "../src/MenuController.js";
import type { ControlledMenu } from "../src/MenuController.js";
import type { CloseReason, OpenInput } from "../src/types.js";

interface TestMenu extends ControlledMenu {
  name: string;
  opened: OpenInput[];
  closed: CloseReason[];
  targetDepth: number;
  hasTargetsValue: boolean;
  triggerType: string;
}

function createTestMenu(name: string, targetDepth = 0): TestMenu {
  return {
    name,
    root: null,
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

    controller.register(first);
    controller.register(second);
    controller.requestOpen(first, { x: 1, y: 2 });
    controller.requestOpen(second, { x: 3, y: 4 });

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

    controller.register(outer);
    controller.register(inner);
    controller.requestOpen(outer, { triggerEvent: event });
    controller.requestOpen(inner, { triggerEvent: event });
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

    controller.register(first);
    controller.register(second);
    controller.requestOpen(first, { triggerEvent: event });
    controller.requestOpen(second, { triggerEvent: event });
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

    controller.register(row);
    controller.register(body);
    controller.requestOpen(body, { triggerEvent: event });
    await Promise.resolve();

    expect(body.opened).toHaveLength(0);
    expect(row.opened).toHaveLength(1);
    expect(controller.activeMenu).toBe(row);
  });
});
