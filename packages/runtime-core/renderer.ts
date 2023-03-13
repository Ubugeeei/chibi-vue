import { ReactiveEffect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/shapeFlags";
import { createAppAPI } from "./apiCreateApp";
import {
  type ComponentInternalInstance,
  createComponentInstance,
  setupComponent,
  Data,
} from "./component";
import { renderComponentRoot } from "./componentRenderUtils";
import {
  Text,
  normalizeVNode,
  type VNode,
  type VNodeArrayChildren,
} from "./vnode";

export type RootRenderFunction<HostElement = RendererElement> = (
  vnode: VNode | null,
  container: HostElement,
  isSVG?: boolean
) => void;

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void;

  insert(
    parentNode: HostNode,
    newNode: HostNode,
    referenceNode: HostNode
  ): void;
  remove(child: HostNode): void;

  createElement(tagName: string): HostElement;
  createComment(text: string): HostNode;
  createText(text: string): Text;

  setText(node: HostNode, text: string): void;
  setElementText(node: HostElement, text: string): void;

  parentNode(node: HostNode): HostNode | null;
  nextSibling(node: HostNode): HostNode | null;
}

// Renderer Node can technically be any object in the context of core renderer
// logic - they are never directly operated on and always passed to the node op
// functions provided via options, so the internal constraint is really just
// a generic object.
export interface RendererNode {
  [key: string]: any;
}

export interface RendererElement extends RendererNode {}

// These functions are created inside a closure and therefore their types cannot
// be directly exported. In order to avoid maintaining function signatures in
// two places, we declare them once here and use them inside the closure.
type PatchFn = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null
) => void;

type ProcessTextOrCommentFn = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null
) => void;

type MountChildrenFn = (
  children: VNodeArrayChildren,
  container: RendererElement,
  anchor: RendererNode | null
) => void;

type PatchChildrenFn = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null
) => void;

type MountComponentFn = (
  initialVNode: VNode,
  container: RendererElement,
  anchor: RendererNode | null
) => void;

type NextFn = (vnode: VNode) => RendererNode | null;

type UnmountFn = (vnode: VNode) => void;
type RemoveFn = (vnode: VNode) => void;

type UnmountChildrenFn = (children: VNode[]) => void;

type SetupRenderEffectFn = (
  instance: ComponentInternalInstance,
  initialVNode: VNode,
  container: RendererElement,
  anchor: RendererNode | null
) => void;

// implementation
export function createRenderer(options: RendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options;

  const patch: PatchFn = (n1, n2, container, anchor) => {
    const { type, shapeFlag } = n2;
    if (type === Text) {
      processText(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      processComponent(n1, n2, container, anchor);
    }
  };

  const processText: ProcessTextOrCommentFn = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateText(n2.children as string)),
        container,
        anchor!
      );
    } else {
      const el = (n2.el = n1.el!);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string);
      }
    }
  };

  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };

  const mountElement = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
    let el: RendererElement;
    const { type, props, shapeFlag } = vnode;

    el = vnode.el = hostCreateElement(type as string);

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children as VNodeArrayChildren, el, null);
    }

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    hostInsert(el, container, anchor!);
  };

  const patchElement = (n1: VNode, n2: VNode) => {
    const el = (n2.el = n1.el!);

    const oldProps = n1.props ?? {};
    const newProps = n2.props ?? {};
    patchChildren(n1, n2, el, null);
    patchProps(el, oldProps, newProps);
  };

  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      updateComponent(n1, n2);
    }
  };

  const patchProps = (el: RendererElement, oldProps: Data, newProps: Data) => {
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
    for (const key in newProps) {
      const next = newProps[key];
      const prev = oldProps[key];
      // defer patching value
      if (next !== prev) {
        hostPatchProp(el, key, prev, next);
      }
    }
  };

  const mountChildren: MountChildrenFn = (children, container, anchor) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i]);
      patch(null, child, container, anchor);
    }
  };

  const mountComponent: MountComponentFn = (
    initialVNode,
    container,
    anchor
  ) => {
    // prettier-ignore
    const instance: ComponentInternalInstance = (initialVNode.component = createComponentInstance(initialVNode));
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  };

  const updateComponent = (n1: VNode, n2: VNode) => {
    const instance = (n2.component = n1.component)!;
    instance.next = n2;
    instance.update();
  };

  const setupRenderEffect: SetupRenderEffectFn = (
    instance,
    initialVNode,
    container,
    anchor
  ) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { m } = instance;
        const subTree = (instance.subTree = renderComponentRoot(instance));
        patch(null, subTree, container, anchor);
        initialVNode.el = subTree.el;

        // mounted hook
        // NOTE: scheduled on post-render
        Promise.resolve().then(() => m?.forEach((cb) => cb()));

        instance.isMounted = true;
      } else {
        let { next, vnode } = instance;

        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        } else {
          next = vnode;
        }

        const prevTree = instance.subTree;
        const nextTree = renderComponentRoot(instance);
        instance.subTree = nextTree;

        patch(
          prevTree,
          nextTree,
          hostParentNode(prevTree.el!)!,
          getNextHostNode(prevTree)
        );
        next.el = nextTree.el;
      }
    };
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      instance.scope
    ));
    const update = (instance.update = () => effect.run());
    update();
  };

  const updateComponentPreRender = (
    instance: ComponentInternalInstance,
    nextVNode: VNode
  ) => {
    nextVNode.component = instance;
    instance.vnode = nextVNode;
    instance.next = null;
  };

  const patchChildren: PatchChildrenFn = (n1, n2, container, anchor) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { shapeFlag } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1 as VNode[]);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2 as string);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: dynamic children
          // two arrays, cannot assume anything, do full diff
          let _c1 = (c1 || []) as VNode[];
          let _c2 = (c2 || []) as VNode[];
          let i;
          for (i = 0; i < _c2.length; i++) {
            const nextChild = (_c2[i] = normalizeVNode(c2[i]));
            patch(_c1[i], nextChild, container, null);
          }
        } else {
          // no new children, just unmount old
          unmountChildren(c1 as VNode[]);
        }
      } else {
        // prev children was text OR null
        // new children is array OR null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, "");
        }
        // mount new if array
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2 as VNodeArrayChildren, container, anchor);
        }
      }
    }
  };

  const unmount: UnmountFn = (vnode) => {
    const { shapeFlag, children } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vnode.component!);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children as VNode[]);
    }
    remove(vnode);
  };

  const remove: RemoveFn = (vnode) => {
    const { el } = vnode;
    hostRemove(el!);
  };

  const unmountComponent = (instance: ComponentInternalInstance) => {
    const { subTree } = instance;
    unmount(subTree);
  };

  const unmountChildren: UnmountChildrenFn = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const getNextHostNode: NextFn = (vnode) => {
    if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
      return getNextHostNode(vnode.component!.subTree);
    }
    return hostNextSibling(vnode.el!);
  };

  const render: RootRenderFunction = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch((container as any)._vnode || null, vnode, container, null);
    }
    (container as any)._vnode = vnode;
  };

  return {
    render,
    createApp: createAppAPI(render),
  };
}
