import { isObject } from "../shared";
import { mutableHandlers } from "./baseHandler";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean;
}

export const reactiveMap = new WeakMap<Target, any>();

export function reactive(target: Target) {
  const existingProxy = reactiveMap.get(target);

  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);

  return proxy;
}

export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value;

export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}
