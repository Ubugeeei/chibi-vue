import { Dep, createDep } from "./dep";
import { trackEffects, triggerEffects } from "./effect";
import { toReactive } from "./reactive";

export interface Ref<T = any> {
  value: T;
}

type RefBase<T> = {
  dep?: Dep;
  value: T;
};

export function trackRefValue(ref: RefBase<any>) {
  trackEffects(ref.dep || (ref.dep = createDep()));
}

export function triggerRefValue(ref: RefBase<any>) {
  if (ref.dep) triggerEffects(ref.dep);
}

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>;
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true);
}

export function ref<T = any>(): Ref<T | undefined>;
export function ref<T = any>(value: T): Ref<T>;
export function ref(value?: unknown) {
  return createRef(value, false);
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

class RefImpl<T> {
  private _value: T;
  public dep?: Dep = undefined;
  public readonly __v_isRef = true;

  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._value = __v_isShallow ? value : toReactive(value);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    this._value = toReactive(newVal);
    triggerRefValue(this);
  }
}

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? (ref.value as any) : ref;
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

export function proxyRefs<T extends object>(
  objectWithRefs: T
): ShallowUnwrapRef<T> {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

export type ShallowUnwrapRef<T> = {
  [K in keyof T]: T[K] extends Ref<infer V>
    ? V // if `V` is `unknown` that means it does not extend `Ref` and is undefined
    : T[K] extends Ref<infer V> | undefined
    ? unknown extends V
      ? undefined
      : V | undefined
    : T[K];
};

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect, vi } = import.meta.vitest;

  it("isRef", () => {
    expect(isRef(ref(1))).toBe(true);
    expect(isRef(1)).toBe(false);
  });

  it("test ref: should track and trigger", async () => {
    const { ReactiveEffect } = await import("./effect");
    const mockEffect = vi.fn(() => {});
    const effect = new ReactiveEffect(mockEffect);

    effect.run(); // call count 1

    expect(mockEffect).toHaveBeenCalledTimes(1);

    const state = ref(1);

    const _ = state.value; // should be tracked
    state.value = 2; // should be triggered (call count 2)

    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it("test ref: should trackRefValue and triggerRefValue", async () => {
    const { ReactiveEffect } = await import("./effect");
    const mockEffect = vi.fn(() => {});
    const effect = new ReactiveEffect(mockEffect);

    effect.run(); // call count 1

    expect(mockEffect).toHaveBeenCalledTimes(1);

    const state = ref(1);

    trackRefValue(state);
    triggerRefValue(state); // should be triggered (call count 2)

    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it("test ref: should unref", () => {
    expect(unref(ref(1))).toBe(1);
    expect(unref(1)).toBe(1);
  });
}
