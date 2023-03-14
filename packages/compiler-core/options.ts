import { ElementNode } from "./ast";
import { TextModes } from "./parse";
import { DirectiveTransform, NodeTransform } from "./transform";

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
  /**
   * An object of { name: transform } to be applied to every directive attribute
   * node found on element nodes.
   */
  directiveTransforms?: Record<string, DirectiveTransform | undefined>;
}

export type BindingMetadata = {
  [key: string]: BindingTypes | undefined;
} & {
  __isScriptSetup?: boolean;
};

export const enum BindingTypes {
  DATA = "data",
  SETUP_MAYBE_REF = "setup-maybe-ref",
  OPTIONS = "options",
}
