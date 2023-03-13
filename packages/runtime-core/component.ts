import { proxyRefs } from "../reactivity";
import { ReactiveEffect } from "../reactivity/effect";
import { EffectScope } from "../reactivity/effectScope";
import { isFunction, isObject } from "../shared";
import { ComponentOptions, applyOptions } from "./componentOptions";
import {
  ComponentPublicInstance,
  PublicInstanceProxyHandlers,
} from "./componentPublicInstance";
import { LifecycleHooks } from "./enums";
import { VNode, VNodeChild } from "./vnode";

export type Data = Record<string, unknown>;

export type Component = ConcreteComponent;
export type ConcreteComponent = ComponentOptions;

type LifecycleHook<TFn = Function> = TFn[] | null;

export interface ComponentInternalInstance {
  type: ConcreteComponent;

  /**
   * Vnode representing this component in its parent's vdom tree
   */
  vnode: VNode;
  next: VNode | null;

  proxy: ComponentPublicInstance | null;
  effect: ReactiveEffect;
  scope: EffectScope;

  /**
   * Root vnode of this component's own vdom tree
   */
  subTree: VNode;

  // TODO:
  // directives: Record<string, Directive> | null

  render: InternalRenderFunction | null;
  update: () => void;

  /**
   * This is the target for the public instance proxy. It also holds properties
   * injected by user options (computed, methods etc.) and user-attached
   * custom properties (via `this.x = ...`)
   * @internal
   */
  ctx: Data;

  // state
  data: Data;
  // TODO:
  // props: Data
  // attrs: Data
  // emit: EmitFn

  /**
   * setup related
   * @internal
   */
  setupState: Data;

  // lifecycle
  isMounted: boolean;
  /**
   * @internal
   */
  [LifecycleHooks.MOUNTED]: LifecycleHook;
}

export type InternalRenderFunction = {
  (
    ctx: ComponentPublicInstance,
    $data: ComponentInternalInstance["data"],
    $options: ComponentInternalInstance["ctx"]
  ): VNodeChild;
  _rc?: boolean; // isRuntimeCompiled

  // __COMPAT__ only
  _compatChecked?: boolean; // v3 and already checked for v2 compat
  _compatWrapped?: boolean; // is wrapped for v2 compat
};

export function createComponentInstance(
  vnode: VNode
): ComponentInternalInstance {
  const type = vnode.type as ConcreteComponent;
  const instance: ComponentInternalInstance = {
    type,
    vnode,
    next: null,
    proxy: null,
    effect: null!,
    scope: new EffectScope(),
    subTree: null!,
    update: null!,
    render: null!,
    ctx: {},
    data: {},
    setupState: {},
    isMounted: false,
    m: null,
  };

  instance.ctx = { _: instance };

  return instance;
}

export let currentInstance: ComponentInternalInstance | null = null;

export const setCurrentInstance = (instance: ComponentInternalInstance) => {
  currentInstance = instance;
  instance.scope.on();
};

export const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  currentInstance = null;
};

export const setupComponent = (instance: ComponentInternalInstance) => {
  const Component = instance.type as ComponentOptions;

  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  // Composition API
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    const setupResult = setup();
    if (isFunction(setupResult)) {
      instance.render = setupResult as InternalRenderFunction;
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult);
    }
    unsetCurrentInstance();
  }

  if (compile && !Component.render) {
    const template = Component.template ?? "";
    Component.render = compile(template);
  }

  // Options API
  setCurrentInstance(instance);
  applyOptions(instance);
  unsetCurrentInstance();
};

type CompileFunction = (template: string | object) => InternalRenderFunction;
let compile: CompileFunction | undefined;

/**
 * For runtime-dom to register the compiler.
 * Note the exported method uses any to avoid d.ts relying on the compiler types.
 */
export function registerRuntimeCompiler(_compile: any) {
  compile = _compile;
}
