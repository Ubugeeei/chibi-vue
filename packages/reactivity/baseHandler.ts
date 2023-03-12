import { track, trigger } from "./effect";
import { type Target } from "./reactive";

const get = createGetter();
function createGetter() {
  return function get(target: Target, key: string | symbol, receiver: object) {
    track(target, key);
    return Reflect.get(target, key, receiver);
  };
}

const set = createSetter();
function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const result = Reflect.set(target, key, value, receiver);
    trigger(target, key);
    return result;
  };
}

export const mutableHandlers: ProxyHandler<object> = { get, set };

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect, vi } = import.meta.vitest;

  it("test mutableHandlers: should track and trigger", async () => {
    const { ReactiveEffect } = await import("./effect");
    const mockEffect = vi.fn(() => {});
    const effect = new ReactiveEffect(mockEffect);

    effect.run(); // call count 1

    expect(mockEffect).toHaveBeenCalledTimes(1);

    const proxy = new Proxy<{ foo: string }>({ foo: "abc" }, mutableHandlers);

    const _ = proxy.foo; // should be tracked
    proxy.foo = "def"; // should be triggered (call count 2)

    expect(mockEffect).toHaveBeenCalledTimes(2);
  });
}
