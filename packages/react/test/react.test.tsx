// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextMenuInstance, ContextMenuOptions, OpenInput } from "popright";
import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuHeader,
  ContextMenuItem,
  ContextMenuItems,
  ContextMenuSeparator,
  ContextMenuSubmenu,
  ContextMenuSubmenuContent,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  useDropdownMenu,
  useContextMenu
} from "../src/index.js";

const createContextMenuMock = vi.hoisted(() => vi.fn());
const createDropdownMenuMock = vi.hoisted(() => vi.fn());

vi.mock("popright", () => ({
  createContextMenu: createContextMenuMock,
  createDropdownMenu: createDropdownMenuMock
}));

vi.mock("../../core/dist/index.js", () => ({
  createContextMenu: createContextMenuMock,
  createDropdownMenu: createDropdownMenuMock
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
  createDropdownMenuMock.mockReset();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("useDropdownMenu", () => {
  it("attaches a core dropdown menu to the ref element", () => {
    const instance = createInstance();
    createDropdownMenuMock.mockReturnValue(instance);
    const options = {
      items: [{ id: "new", label: "New" }]
    };

    function Test() {
      const menu = useDropdownMenu<HTMLButtonElement>(options);
      return <button ref={menu.ref}>File</button>;
    }

    const { container, root } = render(<Test />);
    const button = container.querySelector("button");

    expect(createDropdownMenuMock).toHaveBeenCalledWith(button, options);

    unmount(root, container);
  });
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

  it("normalizes compositional content and appends data-driven items by default", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);
    const onSelect = vi.fn();

    const { container, root } = render(
      <ContextMenu id="resume-menu" items={[{ id: "schema", label: "Schema Action" }]}>
        <ContextMenuTrigger asChild context={{ nodeId: "node-1" }}>
          <button>Actions</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuHeader>Section</ContextMenuHeader>
          <ContextMenuItem id="edit" onSelect={onSelect}>
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItems items={[{ id: "parent", label: "Select Parent" }]} />
        </ContextMenuContent>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    expect(createContextMenuMock).toHaveBeenCalledWith(button, {
      id: "resume-menu",
      context: { nodeId: "node-1" },
      trigger: undefined,
      items: [
        { type: "header", label: "Section", align: undefined, hidden: undefined, className: undefined, style: undefined },
        { id: "edit", label: "Edit", onSelect },
        { type: "separator", hidden: undefined },
        { id: "parent", label: "Select Parent" },
        { id: "schema", label: "Schema Action" }
      ]
    });

    unmount(root, container);
  });

  it("supports data prepend and content id precedence", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);

    const { container, root } = render(
      <ContextMenu id="root-id" items={[{ id: "data", label: "Data" }]} itemMergeMode="prepend">
        <ContextMenuTrigger asChild>
          <button>Actions</button>
        </ContextMenuTrigger>
        <ContextMenuContent id="content-id">
          <ContextMenuItem>Composed</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    expect(createContextMenuMock).toHaveBeenCalledWith(button, {
      id: "content-id",
      trigger: undefined,
      context: undefined,
      items: [
        { id: "data", label: "Data" },
        { id: "composed", label: "Composed" }
      ]
    });

    unmount(root, container);
  });

  it("supports replacing composition with data-driven items", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);

    const { container, root } = render(
      <ContextMenu items={[{ id: "data", label: "Data" }]} itemMergeMode="replace-with-data">
        <ContextMenuTrigger asChild>
          <button>Actions</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Composed</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    expect(createContextMenuMock).toHaveBeenCalledWith(button, {
      id: undefined,
      trigger: undefined,
      context: undefined,
      items: [{ id: "data", label: "Data" }]
    });

    unmount(root, container);
  });

  it("normalizes submenu composition into child items", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);

    const { container, root } = render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button>Actions</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSubmenu>
            <ContextMenuSubmenuTrigger>More</ContextMenuSubmenuTrigger>
            <ContextMenuSubmenuContent>
              <ContextMenuItem>Details</ContextMenuItem>
            </ContextMenuSubmenuContent>
          </ContextMenuSubmenu>
        </ContextMenuContent>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    expect(createContextMenuMock).toHaveBeenCalledWith(button, {
      id: undefined,
      trigger: undefined,
      context: undefined,
      items: [
        {
          type: "submenu",
          id: "more",
          label: "More",
          items: [{ id: "details", label: "Details" }]
        }
      ]
    });

    unmount(root, container);
  });

  it("disables trigger wiring without suppressing the child contextmenu handler", () => {
    const instance = createInstance();
    createContextMenuMock.mockReturnValue(instance);
    const onContextMenu = vi.fn();

    const { container, root } = render(
      <ContextMenu>
        <ContextMenuTrigger asChild disabled onContextMenu={onContextMenu}>
          <button>Actions</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Composed</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const button = container.querySelector("button");
    expect(createContextMenuMock).toHaveBeenCalledWith(button, {
      id: undefined,
      trigger: "manual",
      context: undefined,
      items: [{ id: "composed", label: "Composed" }]
    });

    button?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    expect(onContextMenu).toHaveBeenCalledOnce();

    unmount(root, container);
  });
});

describe("DropdownMenu", () => {
  it("wraps the dropdown hook in simple mode", () => {
    const instance = createInstance();
    createDropdownMenuMock.mockReturnValue(instance);

    const { container, root } = render(
      <DropdownMenu items={[{ id: "new", label: "New" }]}>
        <button>File</button>
      </DropdownMenu>
    );

    const button = container.querySelector("button");
    expect(createDropdownMenuMock).toHaveBeenCalledWith(button, {
      items: [{ id: "new", label: "New" }]
    });

    unmount(root, container);
  });

  it("normalizes structured dropdown content", () => {
    const instance = createInstance();
    createDropdownMenuMock.mockReturnValue(instance);
    const onClick = vi.fn();

    const { container, root } = render(
      <DropdownMenu id="file-menu">
        <ContextMenuTrigger asChild onClick={onClick}>
          <button>File</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>New</ContextMenuItem>
        </ContextMenuContent>
      </DropdownMenu>
    );

    const button = container.querySelector("button");
    expect(createDropdownMenuMock).toHaveBeenCalledWith(button, {
      id: "file-menu",
      trigger: undefined,
      context: undefined,
      items: [{ id: "new", label: "New" }]
    });

    button?.click();
    expect(onClick).toHaveBeenCalledOnce();

    unmount(root, container);
  });
});
