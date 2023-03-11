import { isArray, isString, isSymbol } from "../shared";
import {
  ArrayExpression,
  CallExpression,
  CompoundExpressionNode,
  ExpressionNode,
  InterpolationNode,
  JSChildNode,
  NodeTypes,
  ObjectExpression,
  RootNode,
  SimpleExpressionNode,
  TemplateChildNode,
  TextNode,
  VNodeCall,
} from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helperNameMap,
} from "./runtimeHelpers";

export interface CodegenResult {
  code: string;
  ast: RootNode;
}

type CodegenNode = TemplateChildNode | JSChildNode;

export interface CodegenContext {
  code: string;
  line: number;
  column: number;
  offset: number;
  indentLevel: number;
  helper(key: symbol): string;
  push(code: string, node?: CodegenNode): void;
  indent(): void;
  deindent(withoutNewLine?: boolean): void;
  newline(): void;
}

function createCodegenContext(): CodegenContext {
  const context: CodegenContext = {
    code: ``,
    column: 1,
    line: 1,
    offset: 0,
    indentLevel: 0,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    push(code) {
      context.code += code;
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel;
      } else {
        newline(--context.indentLevel);
      }
    },
    newline() {
      newline(context.indentLevel);
    },
  };

  function newline(n: number) {
    context.push("\n" + `  `.repeat(n));
  }

  return context;
}

export function generate(ast: RootNode): CodegenResult {
  const context = createCodegenContext();
  const { push } = context;

  push(`function render() { `);
  push(`return `);
  if (ast.children) {
    ast.children.forEach((codegenNode) => {
      genNode(codegenNode, context);
    });
  }
  push(` }`);

  return {
    ast,
    code: context.code,
  };
}

function genNode(node: CodegenNode | symbol | string, context: CodegenContext) {
  if (isString(node)) {
    context.push(node);
    return;
  }

  if (isSymbol(node)) {
    context.push(context.helper(node));
    return;
  }

  switch (node.type) {
    case NodeTypes.ELEMENT: {
      genNode(node.codegenNode!, context);
      break;
    }

    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context);
      break;
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(node, context);
      break;
    case NodeTypes.JS_ARRAY_EXPRESSION:
      genArrayExpression(node, context);
      break;
    default: {
      // make sure we exhaust all possible types
      const exhaustiveCheck: never = node;
      return exhaustiveCheck;
    }
  }
}

function genText(node: TextNode, context: CodegenContext) {
  context.push(JSON.stringify(node.content), node);
}

function genExpression(node: SimpleExpressionNode, context: CodegenContext) {
  const { content, isStatic } = node;
  context.push(isStatic ? JSON.stringify(content) : content, node);
}

function genInterpolation(node: InterpolationNode, context: CodegenContext) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}

function genCompoundExpression(
  node: CompoundExpressionNode,
  context: CodegenContext
) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i];
    if (isString(child)) {
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genExpressionAsPropertyKey(
  node: ExpressionNode,
  context: CodegenContext
) {
  const { push } = context;
  if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    push(`[`);
    genCompoundExpression(node, context);
    push(`]`);
  } else if (node.isStatic) {
    push(JSON.stringify(node.content), node);
  } else {
    push(`[${node.content}]`, node);
  }
}

function genVNodeCall(node: VNodeCall, context: CodegenContext) {
  const { push, helper } = context;
  const { tag, props, children } = node;

  push(helper(CREATE_ELEMENT_VNODE) + `(`, node);
  genNodeList(genNullableArgs([tag, props, children]), context);
  push(`)`);
}

function genNullableArgs(args: any[]): CallExpression["arguments"] {
  let i = args.length;
  while (i--) {
    if (args[i] != null) break;
  }
  return args.slice(0, i + 1).map((arg) => arg || `null`);
}

// JavaScript
function genCallExpression(node: CallExpression, context: CodegenContext) {
  const { push, helper } = context;
  const callee = isString(node.callee) ? node.callee : helper(node.callee);
  push(callee + `(`, node);
  genNodeList(node.arguments, context);
  push(`)`);
}

function genObjectExpression(node: ObjectExpression, context: CodegenContext) {
  const { push } = context;
  const { properties } = node;

  if (!properties.length) {
    push(`{}`, node);
    return;
  }

  push(`{ `);
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    // key
    genExpressionAsPropertyKey(key, context);
    push(`: `);
    // value
    genNode(value, context);
    if (i < properties.length - 1) {
      // will only reach this if it's multilines
      push(`,`);
    }
  }
  push(` }`);
}

function genArrayExpression(node: ArrayExpression, context: CodegenContext) {
  genNodeListAsArray(node.elements as CodegenNode[], context);
}

function genNodeListAsArray(
  nodes: (string | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext
) {
  context.push(`[`);
  genNodeList(nodes, context);
  context.push(`]`);
}

function genNodeList(
  nodes: (string | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext,
  comma: boolean = true
) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else if (isArray(node)) {
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }

    if (i < nodes.length - 1) {
      comma && push(", ");
    }
  }
}
