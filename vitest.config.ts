import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    include: [
      "./packages/reactivity/*.ts",
      "./packages/shared/*.ts",
      "./packages/runtime-core/vnode.ts",
      "./packages/runtime-core/h.ts",
    ],
    exclude: [
      "./packages/reactivity/index.ts",
      "./packages/reactivity/dep.ts",
      "./packages/reactivity/effectScope.ts",
      "./packages/shared/shapeFlags.ts",
    ],
  },
});
