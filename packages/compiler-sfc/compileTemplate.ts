import { CodegenResult, ParserOptions, RootNode } from "../compiler-core";
import * as CompilerDOM from "../compiler-dom";

export interface TemplateCompiler {
  compile(template: string): CodegenResult;
  parse(template: string, options: ParserOptions): RootNode;
}

export interface SFCTemplateCompileResults {
  code: string;
  source: string;
  ast?: RootNode;
}

export interface SFCTemplateCompileOptions {
  source: string;
  compiler?: TemplateCompiler;
}

export function compileTemplate({
  source,
  compiler = CompilerDOM,
}: SFCTemplateCompileOptions): SFCTemplateCompileResults {
  let { code, ast } = compiler.compile(source);
  return { code, ast, source };
}
