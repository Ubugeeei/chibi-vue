import { isArray, isObject } from "../shared";
import { type VNode, createVNode, isVNode } from "./vnode";

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // single vnode without props
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      // props without children
      return createVNode(type, propsOrChildren);
    } else {
      // omit props
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

/**
 *
 * ----------- tests
 *
 */
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("test h: element node with text child", async () => {
    const { ShapeFlags } = await import("../shared/shapeFlags");
    {
      const vnode = h("div", { id: "foo" }, "bar");
      expect(vnode).toStrictEqual({
        __v_isVNode: true,
        type: "div",
        props: { id: "foo" },
        el: null,
        children: "bar",
        component: null,
        ctx: null,
        shapeFlag: ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN,
      });
    }
    {
      const vnode = h("div", { id: "foo" }, ["bar"]);
      expect(vnode).toStrictEqual({
        __v_isVNode: true,
        type: "div",
        props: { id: "foo" },
        el: null,
        children: ["bar"],
        component: null,
        ctx: null,
        shapeFlag: ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN,
      });
    }
  });

  it("test h: element node with element child", async () => {
    const { ShapeFlags } = await import("../shared/shapeFlags");

    const vnode = h("div", { id: "foo" }, [h("div", { id: "foo" }, "bar")]);
    expect(vnode).toStrictEqual({
      __v_isVNode: true,
      type: "div",
      props: { id: "foo" },
      el: null,
      children: [
        {
          __v_isVNode: true,
          type: "div",
          props: { id: "foo" },
          el: null,
          children: "bar",
          component: null,
          ctx: null,
          shapeFlag: ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN,
        },
      ],
      component: null,
      ctx: null,
      shapeFlag: ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN,
    });
  });

  it("test h: element node with only tag name", async () => {
    const { ShapeFlags } = await import("../shared/shapeFlags");
    {
      const vnode = h("div");
      expect(vnode).toStrictEqual({
        __v_isVNode: true,
        type: "div",
        props: null,
        el: null,
        children: null,
        component: null,
        ctx: null,
        shapeFlag: ShapeFlags.ELEMENT,
      });
    }
  });
}
