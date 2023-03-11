import { createRenderer, type CreateAppFunction } from "../runtime-core";
import { isString } from "../shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
import { type RootRenderFunction } from "../runtime-core/renderer";

const renderer = createRenderer({ ...nodeOps, patchProp });

export const render = ((...args) => {
  renderer.render(...args);
}) as RootRenderFunction<Element>;

export const createApp = ((...args) => {
  const app = renderer.createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector: Element | string): any => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;
    mount(container);
  };
  return app;
}) as CreateAppFunction<Element>;

function normalizeContainer(container: Element | string): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container);
    return res;
  } else {
    return container;
  }
}

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from "../runtime-core";
