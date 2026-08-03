// @vitest-environment jsdom

import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { DropdownMenu } from "../src/index.js";

function render(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return { container, root };
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
    await Promise.resolve();
  });
}

function unmount(root: Root, container: HTMLElement) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("DropdownMenu simple mode integration", () => {
  it("opens, renders, selects, and cleans up a real dropdown", async () => {
    const onOpen = vi.fn();
    const onSelect = vi.fn();
    const { container, root } = render(
      <DropdownMenu items={[{ id: "new", label: "New", onSelect }]} onOpen={onOpen}>
        <button>File</button>
      </DropdownMenu>
    );
    const trigger = container.querySelector("button")!;

    await click(trigger);

    expect(onOpen).toHaveBeenCalledOnce();
    const menu = document.querySelector<HTMLElement>("[data-popright-menu]");
    expect(menu).not.toBeNull();
    const item = menu!.querySelector<HTMLElement>("[data-popright-item]")!;

    await click(item);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(document.querySelector("[data-popright-menu]")).toBeNull();

    await click(trigger);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(document.querySelector("[data-popright-menu]")).not.toBeNull();

    unmount(root, container);
    expect(document.querySelector("[data-popright-menu]")).toBeNull();

    await click(trigger);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(document.querySelector("[data-popright-menu]")).toBeNull();
  });

  it("keeps exactly one live trigger listener in StrictMode", async () => {
    const onOpen = vi.fn();
    const { container, root } = render(
      <StrictMode>
        <DropdownMenu items={[{ id: "new", label: "New" }]} onOpen={onOpen}>
          <button>File</button>
        </DropdownMenu>
      </StrictMode>
    );
    const trigger = container.querySelector("button")!;

    await click(trigger);

    expect(onOpen).toHaveBeenCalledOnce();
    expect(document.querySelectorAll("[data-popright-menu]")).toHaveLength(1);

    await click(trigger);
    expect(document.querySelector("[data-popright-menu]")).toBeNull();

    await click(trigger);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(document.querySelectorAll("[data-popright-menu]")).toHaveLength(1);

    unmount(root, container);
  });

  it("does not replace the target listener when the trigger rerenders during click", async () => {
    const onOpen = vi.fn();

    function Test() {
      const [clicks, setClicks] = React.useState(0);
      return (
        <DropdownMenu items={[{ id: "new", label: "New" }]} onOpen={onOpen}>
          <button
            onClick={() => flushSync(() => setClicks((value) => value + 1))}
          >
            File {clicks}
          </button>
        </DropdownMenu>
      );
    }

    const { container, root } = render(
      <StrictMode>
        <Test />
      </StrictMode>
    );
    const trigger = container.querySelector("button")!;

    await click(trigger);

    expect(trigger.textContent).toBe("File 1");
    expect(onOpen).toHaveBeenCalledOnce();
    expect(document.querySelector("[data-popright-menu]")).not.toBeNull();

    unmount(root, container);
  });

  it("supports forwardRef triggers and preserves callback and object refs", async () => {
    const callbackCleanup = vi.fn();
    const callbackRef = vi.fn((_node: HTMLButtonElement | null) => callbackCleanup);
    const objectRef = React.createRef<HTMLButtonElement>();
    const ForwardedTrigger = React.forwardRef<HTMLButtonElement, { label: string }>(
      ({ label }, forwardedRef) => <button ref={forwardedRef}>{label}</button>
    );
    const { container: firstContainer, root: firstRoot } = render(
      <DropdownMenu items={[{ id: "new", label: "New" }]}>
        <ForwardedTrigger label="Forwarded" ref={callbackRef} />
      </DropdownMenu>
    );
    const forwardedButton = firstContainer.querySelector("button")!;

    expect(callbackRef).toHaveBeenCalledWith(forwardedButton);
    await click(forwardedButton);
    expect(document.querySelector("[data-popright-menu]")).not.toBeNull();
    unmount(firstRoot, firstContainer);
    expect(callbackCleanup).toHaveBeenCalledOnce();
    expect(callbackRef).not.toHaveBeenCalledWith(null);

    const { container: secondContainer, root: secondRoot } = render(
      <DropdownMenu items={[{ id: "open", label: "Open" }]}>
        <button ref={objectRef}>Object ref</button>
      </DropdownMenu>
    );
    expect(objectRef.current).toBe(secondContainer.querySelector("button"));

    await click(objectRef.current!);
    expect(document.querySelector("[data-popright-menu]")).not.toBeNull();

    unmount(secondRoot, secondContainer);
    expect(objectRef.current).toBeNull();
  });
});
