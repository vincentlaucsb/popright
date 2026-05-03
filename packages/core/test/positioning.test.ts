import { describe, expect, it } from "vitest";
import { computeMenuPosition, resolveAxisPosition } from "../src/positioning.js";

describe("menu positioning", () => {
  it("keeps the preferred point when the menu fits", () => {
    expect(
      computeMenuPosition({
        preferredLeft: 40,
        preferredTop: 50,
        width: 100,
        height: 80,
        viewportWidth: 400,
        viewportHeight: 300,
        padding: 8,
        strategy: "fixed"
      })
    ).toEqual({ left: 40, top: 50 });
  });

  it("flips to the opposite side before clamping", () => {
    expect(resolveAxisPosition(380, 120, 400, 8)).toBe(260);
    expect(resolveAxisPosition(290, 100, 300, 8)).toBe(190);
  });

  it("clamps inside the padded viewport when neither side fully fits", () => {
    expect(resolveAxisPosition(360, 500, 400, 8)).toBe(8);
    expect(resolveAxisPosition(-20, 100, 400, 8)).toBe(8);
  });

  it("adds scroll offsets for absolute positioning", () => {
    expect(
      computeMenuPosition({
        preferredLeft: 20,
        preferredTop: 30,
        width: 100,
        height: 80,
        viewportWidth: 400,
        viewportHeight: 300,
        padding: 8,
        strategy: "absolute",
        scrollX: 200,
        scrollY: 500
      })
    ).toEqual({ left: 220, top: 530 });
  });
});
