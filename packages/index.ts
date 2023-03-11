export * from "./runtime-dom";
export * from "./runtime-core";
import * as runtimeDom from "./runtime-dom";

import { compile } from "./compiler-dom";
import { RenderFunction, registerRuntimeCompiler } from "./runtime-core";

function compileToFunction(template: string): RenderFunction {
  const { code } = compile(template);
  return new Function("Vue", code)(runtimeDom);
}

registerRuntimeCompiler(compileToFunction);
