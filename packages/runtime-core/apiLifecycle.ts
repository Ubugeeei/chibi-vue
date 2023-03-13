import {
  ComponentInternalInstance,
  currentInstance,
  setCurrentInstance,
} from "./component";
import { LifecycleHooks } from "./enums";

export function injectHook(
  type: LifecycleHooks,
  hook: Function,
  target: ComponentInternalInstance | null = currentInstance
): Function | undefined {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = (...args: unknown[]) => {
      setCurrentInstance(target);
      const res = hook(...args);
      return res;
    };
    hooks.push(wrappedHook);
    return wrappedHook;
  }
}

export const createHook =
  <T extends Function = () => any>(lifecycle: LifecycleHooks) =>
  (hook: T, target: ComponentInternalInstance | null = currentInstance) =>
    injectHook(lifecycle, (...args: unknown[]) => hook(...args), target);

export const onMounted = createHook(LifecycleHooks.MOUNTED);
