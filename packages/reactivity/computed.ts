import { Dep } from "./dep";
import { ReactiveEffect } from "./effect";
import { Ref, trackRefValue } from "./ref";

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T;
}

interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>;
}

type ComputedGetter<T> = (...args: any[]) => T;

export class ComputedRefImpl<T> {
  public dep?: Dep = undefined;
  private _value!: T;
  public readonly effect: ReactiveEffect<T>;
  public readonly __v_isRef = true;

  constructor(getter: ComputedGetter<T>) {
    this.effect = new ReactiveEffect(getter);
    this.effect.computed = this;
  }

  get value() {
    trackRefValue(this);
    this._value = this.effect.run()!;
    return this._value;
  }

  set value(_: T) {
    // readonly
    return;
  }
}

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>;
export function computed<T>(getter: ComputedGetter<T>) {
  return new ComputedRefImpl(getter);
}

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect, vi } = import.meta.vitest;

  it("test computed: should track and trigger", async () => {
    const { ReactiveEffect, ref } = await import(".");
    const mockEffect = vi.fn(() => {});
    const effect = new ReactiveEffect(mockEffect);
    effect.run();

    const count = ref(1);

    const computedGetter = vi.fn(() => count.value * 2);
    const countDouble = computed(computedGetter);

    expect(countDouble.value).toBe(2); // call count 1
    expect(computedGetter).toHaveBeenCalledTimes(1);
    
    count.value = 2; // call count 2
    expect(computedGetter).toHaveBeenCalledTimes(2);
    expect(countDouble.value).toBe(4); // call count 3

    count.value = 4; // call count 4
    expect(computedGetter).toHaveBeenCalledTimes(4);
    expect(countDouble.value).toBe(8); // call count 5
    expect(computedGetter).toHaveBeenCalledTimes(5);
  });
}
