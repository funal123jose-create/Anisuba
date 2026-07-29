import { describe, expect, it } from "vitest";
import { parseFormBoolean } from "./form-values";

describe("parseFormBoolean", () => {
  it.each([true, "true", "on", "1"])("accepts %p as true", (value) => {
    expect(parseFormBoolean(value)).toBe(true);
  });

  it.each([false, "false", "off", "0", "", null, undefined])(
    "accepts %p as false",
    (value) => {
      expect(parseFormBoolean(value)).toBe(false);
    },
  );
});
