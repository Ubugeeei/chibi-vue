import { baseCompile } from "../compiler-core";
import { CodegenResult } from "./codegen";

export function compile(template: string): CodegenResult {
  // TODO: impl baseCompile
  return baseCompile(template) as any;
}
