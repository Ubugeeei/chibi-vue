import { RootNode, baseCompile } from "../compiler-core";
import { baseParse } from "../compiler-core/parse";
import { CodegenResult } from "./codegen";

export function compile(
  template: string,
  { __BROWSER__ } = { __BROWSER__: true }
): CodegenResult {
  return baseCompile(template, { __BROWSER__ }) as any;
}

export function parse(template: string): RootNode {
  return baseParse(template);
}
