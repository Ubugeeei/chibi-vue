import { RootNode } from "../compiler-core";

export interface CodegenResult {
  code: string;
  preamble: string;
  ast: RootNode;
}
