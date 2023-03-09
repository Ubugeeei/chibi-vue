import { computed, reactive } from "../reactivity";
import { type ComponentInternalInstance } from "./component";
import { VNodeChild, type VNode } from "./vnode";

export type RenderFunction = () => VNodeChild;

export type ComponentOptions = {
  data?: () => Record<string, unknown>;
  methods?: { [key: string]: Function };
  computed?: { [key: string]: Function };
  setup?: () => Record<string, unknown> | (() => VNode);
  render?: () => VNode;
};

export function applyOptions(instance: ComponentInternalInstance) {
  const options = instance.type;
  const publicThis = instance.proxy! as any;
  const ctx = instance.ctx;

  const {
    data: dataOptions,
    methods,
    computed: computedOptions,
    render,
  } = options;

  if (dataOptions) {
    const data = dataOptions.call(publicThis);
    instance.data = reactive(data);
  }

  if (computedOptions) {
    for (const key in computedOptions) {
      const getter = computedOptions[key].bind(publicThis);
      const c = computed(getter);
      Object.defineProperty(ctx, key, {
        get: () => c.value,
      });
    }
  }

  if (methods) {
    Object.keys(methods).forEach((key) => {
      ctx[key] = methods[key].bind(publicThis);
    });
  }

  if (render) {
    instance.render = render;
  }
}
