import { ResolvedOptions } from ".";
import { createDescriptor } from "./createDescriptor";
import { resolveScript } from "./script";
import { SFCDescriptor } from "~/packages/compiler-sfc";
import { transformTemplateInMain } from "./template";

export async function transformMain(
  code: string,
  filename: string,
  options: ResolvedOptions
) {
  const { descriptor } = createDescriptor(filename, code, options);

  // script
  const { code: scriptCode } = genScriptCode(descriptor, options);
  // template
  const { code: templateCode } = genTemplateCode(descriptor, options);
  
  const attachedProps: [string, string][] = [];
  if (templateCode) {
    attachedProps.push(["render", "_sfc_render"]);
  }

  const output: string[] = [scriptCode, templateCode];
  output.push("\n");

  if (attachedProps.length) {
    output.push(
      `export default { ..._sfc_main, ${attachedProps
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")} }`
    );
  } else {
    output.push(`export default _sfc_main`);
  }

  let resolvedCode = output.join("\n");

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

function genTemplateCode(descriptor: SFCDescriptor, options: ResolvedOptions) {
  const template = descriptor.template!;
  return transformTemplateInMain(template.content.trim(), options);
}
