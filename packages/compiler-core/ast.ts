import { isString } from "../shared";
import { TransformContext } from "./transform";
import { PropsExpression } from "./transforms/transformElement";
import { getVNodeHelper } from "./utils";

export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,

  ATTRIBUTE,
  DIRECTIVE,

  COMPOUND_EXPRESSION,

  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
}

export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  TEMPLATE,
}

export interface Node {
  type: NodeTypes;
}

export interface Position {
  offset: number; // from start of file
  line: number;
  column: number;
}

export type ParentNode = RootNode | ElementNode;

export type ExpressionNode = SimpleExpressionNode | CompoundExpressionNode;

export type TemplateChildNode = ElementNode | TextNode | InterpolationNode;
export type TemplateTextChildNode = TextNode | InterpolationNode;

export interface VNodeCall extends Node {
  type: NodeTypes.VNODE_CALL;
  tag: string | symbol | CallExpression;
  props: PropsExpression | undefined;
  children:
    | TemplateChildNode[] // multiple children
    | TemplateTextChildNode
    | SimpleExpressionNode // hoisted
    | undefined;
  isComponent: boolean;
}

// JS Node Types ---------------------------------------------------------------

// We also include a number of JavaScript AST nodes for code generation.
// The AST is an intentionally minimal subset just to meet the exact needs of
// Vue render function generation.

export type JSChildNode =
  | VNodeCall
  | CallExpression
  | ObjectExpression
  | ArrayExpression
  | ExpressionNode;

export interface CallExpression extends Node {
  type: NodeTypes.JS_CALL_EXPRESSION;
  callee: string | symbol;
  arguments: (string | JSChildNode | TemplateChildNode | TemplateChildNode[])[];
}

export interface ObjectExpression extends Node {
  type: NodeTypes.JS_OBJECT_EXPRESSION;
  properties: Array<Property>;
}
export interface Property extends Node {
  type: NodeTypes.JS_PROPERTY;
  key: ExpressionNode;
  value: JSChildNode;
}

export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
  codegenNode: (TemplateChildNode | VNodeCall)[] | undefined;
}

export type ElementNode = PlainElementNode | ComponentNode | TemplateNode;

export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT;
  tag: string;
  tagType: ElementTypes;
  props: Array<AttributeNode | DirectiveNode>;
  children: TemplateChildNode[];
}

export interface PlainElementNode extends BaseElementNode {
  tagType: ElementTypes.ELEMENT;
  codegenNode: (VNodeCall | SimpleExpressionNode)[] | undefined;
}

export interface TemplateNode extends BaseElementNode {
  tagType: ElementTypes.TEMPLATE;
  // TemplateNode is a container type that always gets compiled away
  codegenNode: undefined;
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}

export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION;
  content: ExpressionNode;
}

export interface ComponentNode extends BaseElementNode {
  tagType: ElementTypes.COMPONENT;
  codegenNode: VNodeCall | undefined;
}

export interface SimpleExpressionNode extends Node {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
}

export interface CompoundExpressionNode extends Node {
  type: NodeTypes.COMPOUND_EXPRESSION;
  children: (
    | SimpleExpressionNode
    | CompoundExpressionNode
    | InterpolationNode
    | TextNode
    | string
    | symbol
  )[];

  /**
   * an expression parsed as the params of a function will track
   * the identifiers declared inside the function body.
   */
  identifiers?: string[];
  isHandlerKey?: boolean;
}

export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: TextNode | undefined;
}

export interface DirectiveNode extends Node {
  type: NodeTypes.DIRECTIVE;
  name: string;
  exp: ExpressionNode | undefined;
  arg: ExpressionNode | undefined;
}

export interface ArrayExpression extends Node {
  type: NodeTypes.JS_ARRAY_EXPRESSION;
  elements: Array<string | Node>;
}

// Codegen Node Types ----------------------------------------------------------

export interface DirectiveArguments extends ArrayExpression {
  elements: DirectiveArgumentNode[];
}

export interface DirectiveArgumentNode extends ArrayExpression {
  elements: // dir, exp, arg, modifiers
  | [string]
    | [string, ExpressionNode]
    | [string, ExpressionNode, ExpressionNode]
    | [string, ExpressionNode, ExpressionNode, ObjectExpression];
}

// AST Utilities ---------------------------------------------------------------

export function createRoot(children: TemplateChildNode[]): RootNode {
  return {
    type: NodeTypes.ROOT,
    children,
    codegenNode: undefined,
  };
}

export function createVNodeCall(
  context: TransformContext | null,
  tag: VNodeCall["tag"],
  props?: VNodeCall["props"],
  children?: VNodeCall["children"],
  isComponent: VNodeCall["isComponent"] = false
): VNodeCall {
  if (context) {
    context.helper(getVNodeHelper(isComponent));
  }

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    isComponent,
  };
}

export function createArrayExpression(
  elements: ArrayExpression["elements"]
): ArrayExpression {
  return {
    type: NodeTypes.JS_ARRAY_EXPRESSION,
    elements,
  };
}

export function createObjectExpression(
  properties: ObjectExpression["properties"]
): ObjectExpression {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties,
  };
}

export function createObjectProperty(
  key: Property["key"] | string,
  value: Property["value"]
): Property {
  return {
    type: NodeTypes.JS_PROPERTY,
    key: isString(key) ? createSimpleExpression(key) : key,
    value,
  };
}

export function createSimpleExpression(
  content: SimpleExpressionNode["content"]
): SimpleExpressionNode {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content,
  };
}

export function createCompoundExpression(
  children: CompoundExpressionNode["children"]
): CompoundExpressionNode {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,

    children,
  };
}
