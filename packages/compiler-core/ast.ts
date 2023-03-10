export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,

  ATTRIBUTE,
  DIRECTIVE,
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

export type ExpressionNode = SimpleExpressionNode;
// | CompoundExpressionNode

export type TemplateChildNode = ElementNode | TextNode | InterpolationNode;

export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
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
}

export interface TemplateNode extends BaseElementNode {
  tagType: ElementTypes.TEMPLATE;
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
}

export interface SimpleExpressionNode extends Node {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
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

// AST Utilities ---------------------------------------------------------------

export function createRoot(children: TemplateChildNode[]): RootNode {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}
