import {
  isArray,
  isFunction,
  isObject,
  isPlainObject,
  isString,
  objectToString,
} from ".";

export const toDisplayString = (val: unknown): string => {
  return isString(val)
    ? val
    : val == null
    ? ""
    : isArray(val) ||
      (isObject(val) &&
        (val.toString === objectToString || !isFunction(val.toString)))
    ? JSON.stringify(val, replacer, 2)
    : String(val);
};

const replacer = (_key: string, val: any): any => {
  // can't use isRef here since @vue/shared has no deps
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it("unit test: toDisplayString primitive", () => {
    expect(toDisplayString("foo")).toBe("foo");
    expect(toDisplayString(null)).toBe("");
    expect(toDisplayString(1)).toBe("1");
  });
  it("unit test: toDisplayString object", () => {
    expect(toDisplayString({ a: 1 })).toBe('{\n\x20\x20"a":\x201\n}');
  });
  it("unit test: toDisplayString array", () => {
    expect(toDisplayString([1, 2, 3])).toBe(
      "[\n\x20\x201,\n\x20\x202,\n\x20\x203\n]"
    );
  });
  it("unit test: toDisplayString ref", async () => {
    const { ref } = await import("../reactivity");
    expect(toDisplayString(ref(1))).toBe("1");
    expect(toDisplayString(ref({ a: 1 }))).toBe('{\n\x20\x20"a":\x201\n}');
  });
}
