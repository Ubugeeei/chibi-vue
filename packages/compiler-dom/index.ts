import { RootNode, baseCompile } from "../compiler-core";
import { baseParse } from "../compiler-core/parse";
import { CodegenResult } from "./codegen";

export function compile(template: string): CodegenResult {
  return baseCompile(template) as any;
}

export function parse(template: string): RootNode {
  return baseParse(template);
}
