import { RendererInternals } from "./renderer";
import { VNode } from "./vnode";

export type RootHydrateFunction = (
  vnode: VNode,
  container: (Element | ShadowRoot) & { _vnode?: VNode }
) => void;

const enum DOMNodeTypes {
  ELEMENT = 1,
  TEXT = 3,
  COMMENT = 8,
}

export function createHydrationFunctions(
  rendererInternals: RendererInternals<Node, Element>
) {}
