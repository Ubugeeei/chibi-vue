// Core API ------------------------------------------------------------------

export {
  // core
  reactive,
  ref,
  // utilities
  unref,
  proxyRefs,
  isRef,
  // effect
  ReactiveEffect,
  // effect scope
  EffectScope,
} from "../reactivity";
export type { Ref, ReactiveFlags, ComputedRef } from "../reactivity";

export { computed } from "./apiComputed";
export { onMounted } from "./apiLifecycle";

export { h } from "./h";

export {
  type VNode,
  type VNodeProps as VNodeData,
  createTextVNode,
  createVNode,
  createElementVNode,
} from "./vnode";

export { type RendererOptions, createRenderer } from "./renderer";

export { type CreateAppFunction } from "./apiCreateApp";

export {
  type ComponentInternalInstance,
  registerRuntimeCompiler,
} from "./component";
export { type ComponentOptions, type RenderFunction } from "./componentOptions";
export { type ComponentPublicInstance } from "./componentPublicInstance";

export { capitalize, toHandlerKey, toDisplayString } from "../shared";
