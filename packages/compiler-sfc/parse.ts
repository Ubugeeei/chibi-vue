import { ElementNode, NodeTypes } from "../compiler-core";
import * as CompilerDOM from "../compiler-dom";
import { TemplateCompiler } from "./compileTemplate";

export const DEFAULT_FILENAME = "anonymous.vue";

export interface SFCParseOptions {
  filename?: string;
  sourceRoot?: string;
  compiler?: TemplateCompiler;
}

export interface SFCBlock {
  type: string;
  content: string;
}

export interface SFCTemplateBlock extends SFCBlock {
  type: "template";
  // TODO: use ElementNode AST
  // ast: ElementNode;
}

export interface SFCScriptBlock extends SFCBlock {
  type: "script";
  // TODO: use ESTree AST
  // imports?: Record<string, ImportBinding>;
  // scriptAst?: import("@babel/types").Statement[];
  // scriptSetupAst?: import("@babel/types").Statement[];
}

export interface SFCDescriptor {
  filename: string;
  source: string;
  template: SFCTemplateBlock | null;
  script: SFCScriptBlock | null;
  // TODO: script setup
  // scriptSetup: SFCScriptBlock | null;
}

export interface SFCParseResult {
  descriptor: SFCDescriptor;
}

export function parse(
  source: string,
  { filename = DEFAULT_FILENAME, compiler = CompilerDOM }: SFCParseOptions = {}
): SFCParseResult {
  const descriptor: SFCDescriptor = {
    filename,
    source,
    template: null,
    script: null,
  };

  const ast = compiler.parse(source, {});
  ast.children.forEach((node) => {
    if (node.type !== NodeTypes.ELEMENT) return;

    switch (node.tag) {
      case "template": {
        descriptor.template = createBlock(node, source) as SFCTemplateBlock;
        break;
      }
      case "script": {
        descriptor.script = createBlock(node, source) as SFCScriptBlock;
        break;
      }
      default: {
        break;
      }
    }
  });

  return { descriptor };
}

function createBlock(node: ElementNode, source: string): SFCBlock {
  const type = node.tag;
  let { start, end } = node.loc;
  start = node.children[0].loc.start;
  end = node.children[node.children.length - 1].loc.end;
  const content = source.slice(start.offset, end.offset);
  return { type, content };
}
