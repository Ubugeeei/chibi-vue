import { ResolvedOptions } from ".";
import { type TransformPluginContext } from "rollup";

export async function transformMain(
  code: string,
  filename: string,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  // TODO: parse and compile
  return {
    code: `
      import { ref, computed } from "chibi-vue";
      export default {
        template: \`<div @click="changeMessage">{{ message }}</div>\`,
        setup() {
          const count = ref(0);
          const countDouble = computed(() => count.value * 2);
          const message = ref("Hello chibi-vue!");
          const changeMessage = () => {
            count.value++;
            message.value = \`Hello chibi-vue! \${count.value} * 2 = \${countDouble.value}\`;
          };
          return { message, changeMessage };
        },
      }
    `,
  };
}
