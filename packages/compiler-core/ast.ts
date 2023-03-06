export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  ATTRIBUTE,
}

export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
}

export interface Node {
  type: NodeTypes;
}

export type ParentNode = RootNode | ElementNode;

export type TemplateChildNode = ElementNode | TextNode;

export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
}

export type ElementNode = PlainElementNode | ComponentNode;

export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT;
  tag: string;
  tagType: ElementTypes;
  props: Array<AttributeNode>;
  children: TemplateChildNode[];
}

export interface PlainElementNode extends BaseElementNode {
  tagType: ElementTypes.ELEMENT;
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}

export interface ComponentNode extends BaseElementNode {
  tagType: ElementTypes.COMPONENT;
}

export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: TextNode | undefined;
}

// AST Utilities ---------------------------------------------------------------

export function createRoot(children: TemplateChildNode[]): RootNode {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}
