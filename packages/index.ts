export * from "./runtime-dom";
export * from "./runtime-core";
export * from "./reactivity";

import { compile } from "./compiler-dom";
import { RenderFunction, registerRuntimeCompiler } from "./runtime-core";

function compileToFunction(template: string): RenderFunction {
  const { code } = compile(template);
  return new Function(code)();
}

registerRuntimeCompiler(compileToFunction);
