import { isString } from "../shared";
import { RootNode } from "./ast";
import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";

export function baseCompile(template: string | RootNode) {
  const ast = isString(template) ? baseParse(template) : template;
  transform(ast);
  return generate(ast);
}
