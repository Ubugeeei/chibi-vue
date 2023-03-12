export * from "./toDisplayString";

const onRE = /^on[^a-z]/;
export const isOn = (key: string) => onRE.test(key);

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key);

export const isArray = Array.isArray;
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === "[object Map]";
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === "[object Set]";

export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";
export const isString = (val: unknown): val is string =>
  typeof val === "string";
export const isSymbol = (val: unknown): val is symbol =>
  typeof val === "symbol";
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string =>
  objectToString.call(value);

export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === "[object Object]";

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const toHandlerKey = (str: string) =>
  str ? `on${capitalize(str)}` : ``;

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it("unit test: isOn -> true", () => {
    expect(isOn("onClick")).toBe(true);
    expect(isOn("on-click")).toBe(true);
    expect(isOn("on_click")).toBe(true);
  });
  it("unit test: isOn -> false", () => {
    expect(isOn("onclick")).toBe(false);
    expect(isOn("click")).toBe(false);
  });

  it("unit test: hasOwn -> true", () => {
    expect(hasOwn({ a: 1 }, "a")).toBe(true);
  });
  it("unit test: hasOwn -> false", () => {
    expect(hasOwn({ a: 1 }, "b")).toBe(false);
    expect(hasOwn([], "push")).toBe(false);
  });

  it("unit test: isArray -> true", () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
  });
  it("unit test: isArray -> false", () => {
    expect(isArray({})).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
  });

  it("unit test: isMap -> true", () => {
    expect(isMap(new Map())).toBe(true);
  });
  it("unit test: isMap -> false", () => {
    expect(isMap(new Set())).toBe(false);
    expect(isMap([])).toBe(false);
    expect(isMap({})).toBe(false);
  });

  it("unit test: isSet -> true", () => {
    expect(isSet(new Set())).toBe(true);
  });
  it("unit test: isSet -> false", () => {
    expect(isSet(new Map())).toBe(false);
    expect(isSet([])).toBe(false);
    expect(isSet({})).toBe(false);
  });

  it("unit test: isFunction -> true", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(function f() {})).toBe(true);
  });
  it("unit test: isFunction -> false", () => {
    expect(isFunction([])).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction(undefined)).toBe(false);
  });

  it("unit test: isString -> true", () => {
    expect(isString("")).toBe(true);
    expect(isString("foo")).toBe(true);
  });
  it("unit test: isString -> false", () => {
    expect(isString(1)).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
  });

  it("unit test: isSymbol -> true", () => {
    expect(isSymbol(Symbol())).toBe(true);
    expect(isSymbol(Symbol("a"))).toBe(true);
  });
  it("unit test: isSymbol -> false", () => {
    expect(isSymbol(1)).toBe(false);
    expect(isSymbol("")).toBe(false);
    expect(isSymbol([])).toBe(false);
    expect(isSymbol({})).toBe(false);
    expect(isSymbol(null)).toBe(false);
    expect(isSymbol(undefined)).toBe(false);
  });

  it("unit test: isObject -> true", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(new Map())).toBe(true);
    expect(isObject(new Set())).toBe(true);
  });
  it("unit test: isObject -> false", () => {
    expect(isObject(1)).toBe(false);
    expect(isObject("")).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });

  it("unit test: toTypeString", () => {
    expect(toTypeString({})).toBe("[object Object]");
    expect(toTypeString([])).toBe("[object Array]");
    expect(toTypeString(new Map())).toBe("[object Map]");
    expect(toTypeString(new Set())).toBe("[object Set]");
    expect(toTypeString(1)).toBe("[object Number]");
    expect(toTypeString("")).toBe("[object String]");
    expect(toTypeString(null)).toBe("[object Null]");
    expect(toTypeString(undefined)).toBe("[object Undefined]");
  });

  it("unit test: isPlainObject -> true", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });
  it("unit test: isPlainObject -> false", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
    expect(isPlainObject(new Set())).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject("")).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("unit test: capitalize", () => {
    expect(capitalize("")).toBe("");
    expect(capitalize("a")).toBe("A");
    expect(capitalize("ab")).toBe("Ab");
  });

  it("unit test: toHandlerKey", () => {
    expect(toHandlerKey("")).toBe("");
    expect(toHandlerKey("click")).toBe("onClick");
  });
}
