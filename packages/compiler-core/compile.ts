import { isString } from "../shared";
import { RootNode } from "./ast";
import { baseParse } from "./parse";

export function baseCompile(template: string | RootNode) {
  const ast = isString(template) ? baseParse(template) : template;
  console.log("🚀 ~ file: compile.ts:7 ~ baseCompile ~ ast:", ast);

  // TODO: impl transform
  // transform(ast);

  // TODO: impl generate
  // return generate(ast);
}
