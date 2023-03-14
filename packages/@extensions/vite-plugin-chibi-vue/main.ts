import { ResolvedOptions } from ".";
import { PluginContext, type TransformPluginContext } from "rollup";
import { createDescriptor } from "./createDescriptor";
import { resolveScript } from "./script";
import { SFCDescriptor } from "~/packages/compiler-sfc";

export async function transformMain(
  code: string,
  filename: string,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const { descriptor } = createDescriptor(filename, code, options);
  const { code: scriptCode } = genScriptCode(descriptor, options);

  // TODO: parse and compile
  const resolvedCode = descriptor.script?.content.replace(
    "export default {",
    `export default {\n  template: \`${
      descriptor.template?.content.trim() ?? ""
    }\`,`
  );

  return { code: resolvedCode };
}

function genScriptCode(
  descriptor: SFCDescriptor,
  options: ResolvedOptions
): {
  code: string;
} {
  let scriptCode = `const _sfc_main = {}`;
  const script = resolveScript(descriptor, options);
  if (script) {
    scriptCode = options.compiler.rewriteDefault(script.content, "_sfc_main");
  }

  return { code: scriptCode };
}
