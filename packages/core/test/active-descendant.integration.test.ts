// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createDropdownMenu, type ContextMenuInstance } from "../src/index.js";

const menus: ContextMenuInstance[] = [];
afterEach(() => {
  menus.splice(0).forEach(menu => menu.destroy());
  document.body.replaceChildren();
});

function open(items: Parameters<typeof createDropdownMenu>[1]["items"]) {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const menu = createDropdownMenu(trigger, { items });
  menus.push(menu);
  menu.open({ target: trigger });
  return { menu, trigger, root: menu.root! };
}

function active(root: HTMLElement, label: string) {
  expect(document.activeElement).toBe(root);
  const id = root.getAttribute("aria-activedescendant");
  expect(id).toBeTruthy();
  const item = document.getElementById(id!);
  expect(root.contains(item)).toBe(true);
  expect(item?.querySelector("[data-popright-label-text]")?.textContent).toBe(label);
  expect(item?.hasAttribute("data-active")).toBe(true);
}

it("exposes keyboard and pointer selection while retaining root focus and activation", () => {
  const selected = vi.fn();
  const { root, trigger } = open([
    { type: "header", label: "Actions" },
    { id: "disabled", label: "Disabled", disabled: true },
    { id: "duplicate", label: "First" },
    { id: "duplicate", label: "Last", onSelect: selected }
  ]);
  active(root, "First");
  const firstId = root.getAttribute("aria-activedescendant");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
  active(root, "Last");
  expect(root.getAttribute("aria-activedescendant")).not.toBe(firstId);
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
  active(root, "First");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
  active(root, "Last");
  root.querySelectorAll<HTMLElement>("[data-popright-item]")[1].dispatchEvent(new Event("pointerenter"));
  active(root, "First");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
  active(root, "Last");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  expect(selected).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(trigger);
});

it("keeps portaled submenu IDs distinct and restores the parent active item", () => {
  const { root, trigger } = open([{ type: "submenu", id: "same", label: "More", items: [{ id: "same", label: "Child" }] }]);
  active(root, "More");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
  const child = document.querySelector<HTMLElement>("[data-popright-submenu]")!;
  active(child, "Child");
  expect(child.getAttribute("aria-activedescendant")).not.toBe(root.getAttribute("aria-activedescendant"));
  child.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
  active(root, "More");
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(document.activeElement).toBe(trigger);
});

it("has no dangling active descendant when no item is selectable", () => {
  const { menu, root } = open([{ type: "label", label: "Nothing available" }]);
  root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
  expect(root.hasAttribute("aria-activedescendant")).toBe(false);
  menu.close();
});

it("allocates unique row IDs in an adopted portal document and keeps them stable", () => {
  const destination = document.implementation.createHTMLDocument('Portal');
  // Reserve a range to exercise a collision without depending on earlier test order.
  destination.body.innerHTML = Array.from({ length: 100 }, (_, index) => `<span id="popright-item-${index + 1}">Existing</span>`).join('');
  const trigger = document.createElement('button');
  document.body.append(trigger);
  const menu = createDropdownMenu(trigger, { portal: destination.body, items: [{ id: 'action', label: 'Action' }] });
  menus.push(menu);
  menu.open({ target: trigger });
  const root = menu.root!;
  const id = root.getAttribute('aria-activedescendant')!;
  expect(destination.getElementById(id)?.textContent).toBe('Action');
  expect(destination.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  expect(root.getAttribute('aria-activedescendant')).toBe(id);
});

it("does not reuse a detached portal container's own ID", () => {
  const first = open([{ id: 'probe', label: 'Probe' }]);
  const lastId = Number(first.root.getAttribute('aria-activedescendant')!.split('-').at(-1));
  first.menu.close();
  const portal = document.createElement('div');
  portal.id = `popright-item-${lastId + 1}`;
  const menu = createDropdownMenu(first.trigger, { portal, items: [{ id: 'action', label: 'Action' }] });
  menus.push(menu);
  menu.open({ target: first.trigger });
  document.body.append(portal);
  const id = menu.root!.getAttribute('aria-activedescendant')!;
  expect(document.getElementById(id)?.textContent).toBe('Action');
  expect(document.getElementById(id)).not.toBe(portal);
  expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
});
