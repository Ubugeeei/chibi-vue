import { isString } from "../shared";
import { RootNode } from "./ast";
import { generate } from "./codegen";
import { baseParse } from "./parse";

export function baseCompile(template: string | RootNode) {
  const ast = isString(template) ? baseParse(template) : template;

  // TODO: remove this log
  console.log("🚀 ~ file: compile.ts:7 ~ baseCompile ~ ast:", ast);

  return generate(ast);
}
