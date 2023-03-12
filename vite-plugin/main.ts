import { ResolvedOptions } from ".";
import { type TransformPluginContext } from "rollup";
import { createDescriptor } from "./createDescriptor";

export async function transformMain(
  code: string,
  filename: string,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const { descriptor } = createDescriptor(filename, code, options);

  // TODO: parse and compile
  const resolvedCode = descriptor.script?.content.replace(
    "export default {",
    `export default {\n  template: \`${
      descriptor.template?.content.trim() ?? ""
    }\`,`
  );

  return { code: resolvedCode };
}
