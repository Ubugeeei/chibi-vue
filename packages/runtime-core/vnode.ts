import { ShapeFlags } from "../shared/shapeFlags";
import { isArray, isObject, isString } from "../shared";
import { currentRenderingInstance } from "./componentRenderContext";
import { type ComponentInternalInstance } from "./component";
import { type ComponentPublicInstance } from "./componentPublicInstance";

export type VNodeTypes =
  | string // html element name
  | typeof Text // html text node
  | ComponentPublicInstance; // Vue Component

export const Text = Symbol();

export interface VNode<HostNode = any> {
  __v_isVNode: true;
  type: VNodeTypes;
  props: VNodeProps | null;
  el: HostNode | undefined;
  children: VNodeNormalizedChildren;
  component: ComponentInternalInstance | null;
  ctx: ComponentPublicInstance | null;
  shapeFlag: number;
}

export interface VNodeProps {
  [key: string]: any;
}

export type VNodeNormalizedChildren = string | VNodeArrayChildren;

export type VNodeChild = VNodeChildAtom | VNodeArrayChildren;
export type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>;
type VNodeChildAtom = VNode | string;

export function isVNode(value: unknown): value is VNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "__v_isVNode" in value &&
    value.__v_isVNode === true
  );
}

export const createVNode = (
  type: VNodeTypes,
  props: VNodeProps | null = null,
  children: unknown = null
) => {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.COMPONENT
    : 0;
  return createBaseVNode(type, props, children, shapeFlag);
};

function createBaseVNode(
  type: VNodeTypes,
  props: VNodeProps | null,
  children: unknown,
  shapeFlag: ShapeFlags | 0 = ShapeFlags.ELEMENT
): VNode {
  const vnode = {
    type,
    props,
    children,
    el: null,
    ctx: currentRenderingInstance,
    shapeFlag,
    component: null,
  } as VNode;

  if (isVNode(type)) {
    normalizeChildren(vnode, children);
  } else if (children) {
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode;
}

export { createBaseVNode as createElementVNode };

export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    children = [createTextVNode(String(children))];
  }
  vnode.children = children as VNodeNormalizedChildren;
  vnode.shapeFlag |= type;
}

export function createTextVNode(text: string = " "): VNode {
  return createVNode(Text, null, text);
}

export function normalizeVNode(child: VNodeChild): VNode {
  if (typeof child === "object") {
    return cloneIfMounted(child as VNode);
  } else {
    return createVNode(Text, null, String(child));
  }
}

export function cloneIfMounted(child: VNode): VNode {
  return child.el === null ? child : cloneVNode(child);
}

export function cloneVNode<T>(vnode: VNode<T>): VNode<T> {
  const { props, children } = vnode;
  const cloned: VNode<T> = {
    __v_isVNode: true,
    type: vnode.type,
    props,
    children: isArray(children)
      ? (children as VNode[]).map(cloneVNode)
      : children,
    component: vnode.component,
    shapeFlag: vnode.shapeFlag,
    el: vnode.el,
    ctx: vnode.ctx,
  };
  return cloned;
}
