import { ElementNode } from "./ast";
import { TextModes } from "./parse";
import { NodeTransform } from "./transform";

export interface ParserOptions {
  /**
   * @default ['{{', '}}']
   */
  delimiters?: [string, string];

  decodeEntities?: (rawText: string, asAttr: boolean) => string;

  /**
   * Get text parsing mode for this element
   */
  getTextMode?: (
    node: ElementNode,
    parent: ElementNode | undefined
  ) => TextModes;
}

export interface TransformOptions {
  /**
   * An array of node transforms to be applied to every AST node.
   */
  nodeTransforms?: NodeTransform[];
}
