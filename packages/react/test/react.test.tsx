// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextMenuInstance, ContextMenuOptions, OpenInput } from "@popright/core";
import * as React from "react";
import { ContextMenu, useContextMenu } from "../src/index.js";

const createContextMenuMock = vi.hoisted(() => vi.fn());

vi.mock("@popright/core", () => ({
  createContextMenu: createContextMenuMock
}));

function createInstance(): ContextMenuInstance {
  return {
    open: vi.fn(),
    close: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
    isOpen: false,
    root: null
  };
}

function render(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return { container, root };
}

function unmount(root: Root, container: HTMLElement) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

beforeEach(() => {
  createContextMenuMock.mockReset();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("useContextMenu", () => {
  it("attaches a core menu to the ref element and destroys it on unmount", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);
    const options: ContextMenuOptions = {
      items: [{ id: "play", label: "Play" }]
    };

    function Test() {
      const menu = useContextMenu<HTMLButtonElement>(options);
      return <button ref={menu.ref}>Actions</button>;
    }

    const { container, root } = render(<Test />);
    const button = container.querySelector("button");

    expect(createContextMenuMock).toHaveBeenCalledWith(button, options);

    unmount(root, container);
    expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it("updates the core instance when options change", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);

    function Test({ label }: { label: string }) {
      const menu = useContextMenu<HTMLButtonElement>({
        items: [{ id: "play", label }]
      });
      return <button ref={menu.ref}>Actions</button>;
    }

    const { container, root } = render(<Test label="Play" />);
    const secondOptions = { items: [{ id: "play", label: "Play Again" }] };

    act(() => {
      root.render(<Test label="Play Again" />);
    });

    expect(instance.update).toHaveBeenCalledWith(secondOptions);

    unmount(root, container);
  });

  it("destroys the old core instance when the ref element changes", () => {
    const firstInstance = createInstance();
    const secondInstance = createInstance();
    createContextMenuMock.mockReturnValueOnce(firstInstance).mockReturnValueOnce(secondInstance);

    function Test({ id }: { id: string }) {
      const menu = useContextMenu<HTMLButtonElement>({
        items: [{ id: "play", label: "Play" }]
      });
      return (
        <button key={id} ref={menu.ref}>
          {id}
        </button>
      );
    }

    const { container, root } = render(<Test id="first" />);

    act(() => {
      root.render(<Test id="second" />);
    });

    expect(firstInstance.destroy).toHaveBeenCalledOnce();
    expect(createContextMenuMock).toHaveBeenCalledTimes(2);

    unmount(root, container);
    expect(secondInstance.destroy).toHaveBeenCalledOnce();
  });

  it("supports manual open before a ref is attached", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);
    const input: OpenInput = { x: 12, y: 24 };
    const options: ContextMenuOptions = {
      trigger: "manual",
      items: [{ id: "play", label: "Play" }]
    };

    function Test() {
      const menu = useContextMenu(options);
      React.useEffect(() => {
        menu.open(input);
      }, [menu]);
      return null;
    }

    const { container, root } = render(<Test />);

    expect(createContextMenuMock).toHaveBeenCalledWith(options);
    expect(instance.open).toHaveBeenCalledWith(input);

    unmount(root, container);
  });
});

describe("ContextMenu", () => {
  it("wraps the hook and preserves the child ref", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);
    const childRef = vi.fn();

    const { container, root } = render(
      <ContextMenu items={[{ id: "play", label: "Play" }]}>
        <button ref={childRef}>Actions</button>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    expect(childRef).toHaveBeenCalledWith(button);
    expect(createContextMenuMock).toHaveBeenCalledWith(button, {
      items: [{ id: "play", label: "Play" }]
    });

    unmount(root, container);
  });

  it("preserves child props", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);
    const onClick = vi.fn();

    const { container, root } = render(
      <ContextMenu items={[{ id: "play", label: "Play" }]}>
        <button type="button" data-album="ride" onClick={onClick}>
          Actions
        </button>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    button?.click();

    expect(button?.dataset.album).toBe("ride");
    expect(onClick).toHaveBeenCalledOnce();

    unmount(root, container);
  });
});
