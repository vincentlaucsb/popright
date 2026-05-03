import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "../src/ContextMenu.js";
import type { MenuController } from "../src/MenuController.js";
import type { OpenInput } from "../src/types.js";

function createControllerSpy() {
  const requestOpen = vi.fn();
  const controller = {
    register: vi.fn(),
    unregister: vi.fn(),
    requestOpen,
    clearActive: vi.fn(),
    setActive: vi.fn()
  } as unknown as MenuController;

  return { controller, requestOpen };
}

describe("ContextMenu target triggers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens from click when trigger is click", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("Element", EventTarget);
    const target = new EventTarget();
    const { controller, requestOpen } = createControllerSpy();
    const menu = new ContextMenu(controller, target, {
      trigger: "click",
      items: [{ id: "play", label: "Play" }]
    });

    const event = new Event("click", { cancelable: true });
    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(requestOpen).toHaveBeenCalledOnce();
    expect(requestOpen.mock.calls[0]?.[0]).toBe(menu);
    expect((requestOpen.mock.calls[0]?.[1] as OpenInput).triggerEvent).toBe(event);

    menu.destroy();
  });

  it("prevents the native menu only for contextmenu triggers", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("Element", EventTarget);
    const target = new EventTarget();
    const { controller, requestOpen } = createControllerSpy();
    const menu = new ContextMenu(controller, target, {
      items: [{ id: "play", label: "Play" }]
    });

    const event = new Event("contextmenu", { cancelable: true });
    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(requestOpen).toHaveBeenCalledOnce();

    menu.destroy();
  });
});

describe("ContextMenu child ownership", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not register child menus with the global controller", () => {
    vi.stubGlobal("document", {});
    const { controller } = createControllerSpy();
    const parent = new ContextMenu(controller, null, {
      items: [{ id: "play", label: "Play" }]
    });

    const child = new ContextMenu(
      controller,
      null,
      {
        trigger: "manual",
        items: [{ id: "info", label: "Info" }]
      },
      { parent, register: false }
    );

    expect(controller.register).toHaveBeenCalledOnce();
    expect(child.parent).toBe(parent);
    expect(child.registeredWithController).toBe(false);

    child.destroy();
    parent.destroy();
  });
});

describe("ContextMenu global close triggers", () => {
  it("closes on scroll by default", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("HTMLElement", EventTarget);
    const { controller } = createControllerSpy();
    const menu = new ContextMenu(controller, null, {
      items: [{ id: "play", label: "Play" }]
    });
    const close = vi.spyOn(menu, "close");
    const { documentTarget, windowTarget, root } = createOpenMenuTargets();
    menu.root = root;

    menu.attachGlobalListeners();
    const scrollEvent = new Event("scroll");
    documentTarget.dispatchEvent(scrollEvent);

    expect(close).toHaveBeenCalledWith("scroll", scrollEvent);
    menu.globalCleanups.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
  });

  it("closes on resize by default", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("HTMLElement", EventTarget);
    const { controller } = createControllerSpy();
    const menu = new ContextMenu(controller, null, {
      items: [{ id: "play", label: "Play" }]
    });
    const close = vi.spyOn(menu, "close");
    const { windowTarget, root } = createOpenMenuTargets();
    menu.root = root;

    menu.attachGlobalListeners();
    const resizeEvent = new Event("resize");
    windowTarget.dispatchEvent(resizeEvent);

    expect(close).toHaveBeenCalledWith("resize", resizeEvent);
    menu.globalCleanups.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
  });

  it("does not close on scroll and resize when opted out", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("HTMLElement", EventTarget);
    const { controller } = createControllerSpy();
    const menu = new ContextMenu(controller, null, {
      closeOnResize: false,
      closeOnScroll: false,
      items: [{ id: "play", label: "Play" }]
    });
    const close = vi.spyOn(menu, "close");
    const { documentTarget, windowTarget, root } = createOpenMenuTargets();
    menu.root = root;

    menu.attachGlobalListeners();
    documentTarget.dispatchEvent(new Event("scroll"));
    windowTarget.dispatchEvent(new Event("resize"));

    expect(close).not.toHaveBeenCalledWith("scroll", expect.any(Event));
    expect(close).not.toHaveBeenCalledWith("resize", expect.any(Event));
    menu.globalCleanups.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
  });
});

function createOpenMenuTargets() {
  const documentTarget = new EventTarget();
  const windowTarget = new EventTarget();
  const root = new EventTarget() as EventTarget & {
    contains(target: EventTarget | null): boolean;
    ownerDocument: Document;
    remove(): void;
  };

  root.contains = () => false;
  root.ownerDocument = Object.assign(documentTarget, {
    defaultView: windowTarget
  }) as unknown as Document;
  root.remove = () => undefined;

  return { documentTarget, windowTarget, root: root as unknown as HTMLElement };
}
