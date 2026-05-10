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

  it("shifts right when the preferred point overflows the left edge", () => {
    expect(resolveAxisPosition(-30, 120, 400, 8)).toBe(8);
  });

  it("shifts down when the preferred point overflows the top edge", () => {
    expect(resolveAxisPosition(-20, 80, 300, 12)).toBe(12);
  });

  it("honors collision padding on every side", () => {
    expect(resolveAxisPosition(0, 100, 400, 16)).toBe(16);
    expect(resolveAxisPosition(390, 100, 400, 16)).toBe(290);
  });

  it("clamps inside the padded viewport when neither side fully fits", () => {
    expect(resolveAxisPosition(360, 500, 400, 8)).toBe(8);
    expect(resolveAxisPosition(-20, 100, 400, 8)).toBe(8);
  });

  it("pins oversized menus to the padded viewport start", () => {
    expect(resolveAxisPosition(20, 600, 400, 24)).toBe(24);
  });

  it("keeps coordinates stable when no collision happens", () => {
    expect(resolveAxisPosition(160, 100, 400, 8)).toBe(160);
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
