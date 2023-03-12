import { CodegenResult, ParserOptions, RootNode } from "../compiler-core";

export interface TemplateCompiler {
  compile(template: string): CodegenResult;
  parse(template: string, options: ParserOptions): RootNode;
}
