import { isArray } from "../shared";
import { ComputedRefImpl } from "./computed";
import { type Dep, createDep } from "./dep";
import { type EffectScope, recordEffectScope } from "./effectScope";

type KeyToDepMap = Map<any, Dep>;
const targetMap = new WeakMap<any, KeyToDepMap>();

export let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = any> {
  public deps: Dep[] = [];
  computed?: ComputedRefImpl<T>;
  constructor(public fn: () => T, scope?: EffectScope) {
    recordEffectScope(this, scope);
  }

  run() {
    activeEffect = this;
    return this.fn();
  }
}

export function track(target: object, key: unknown) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep()));
  }

  trackEffects(dep);
}

export function trackEffects(dep: Dep) {
  if (activeEffect) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

export function trigger(target: object, key?: unknown) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  let deps: (Dep | undefined)[] = [];
  if (key !== void 0) {
    deps.push(depsMap.get(key));
  }

  if (deps.length === 1 && deps[0]) {
    triggerEffects(deps[0]);
  }
}

export function triggerEffects(dep: Dep | ReactiveEffect[]) {
  const effects = isArray(dep) ? dep : [...dep];
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect);
    }
  }

  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect);
    }
  }
}

function triggerEffect(effect: ReactiveEffect) {
  effect.run();
}

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect, vi } = import.meta.vitest;

  it("call effect", () => {
    const mockEffect = vi.fn(() => {});
    const effect = new ReactiveEffect(mockEffect);
    effect.run();
    expect(mockEffect).toHaveBeenCalledOnce();

    // clean up
    activeEffect = undefined;
  });

  it("track effect", () => {
    /*
     * expect targetMap to be:
     *
     * targetMap = Map {
     *    target -> Map {
     *        key -> Set()
     *    }
     * }
     */
    const key = "foo";
    const target = { [key]: "1" };
    track(target, key);
    expect(targetMap.get(target)?.has(key)).toBe(true);

    // clean up
    targetMap.delete(target);
    activeEffect = undefined;
  });

  it("trigger effect", () => {
    const mockEffect = vi.fn(() => {});
    const effect = new ReactiveEffect(mockEffect);
    effect.run(); // call count 1
    expect(mockEffect).toHaveBeenCalledTimes(1);

    /*
     * expect targetMap to be:
     *
     * targetMap = Map {
     *    target -> Map {
     *        key -> Set(effect)
     *    }
     * }
     */
    const key = "foo";
    const target = { [key]: "1" };
    track(target, key);
    expect(targetMap.get(target)?.get(key)).toBe(effect.deps[0]);

    trigger(target, key); // call count 2
    expect(mockEffect).toHaveBeenCalledTimes(2);

    trigger(target, key); // call count 3
    expect(mockEffect).toHaveBeenCalledTimes(3);

    // clean up
    targetMap.delete(target);
    activeEffect = undefined;
  });
}
