import { isArray } from "../shared";
import {
  AttributeNode,
  DirectiveNode,
  ElementNode,
  ElementTypes,
  InterpolationNode,
  NodeTypes,
  Position,
  RootNode,
  TemplateChildNode,
  TextNode,
  createRoot,
} from "./ast";
import { ParserOptions } from "./options";
import { advancePositionWithMutation } from "./utils";

type AttributeValue =
  | {
      content: string;
    }
  | undefined;

// The default decoder only provides escapes for characters reserved as part of
// the template syntax, and is only used if the custom renderer did not provide
// a platform-specific decoder.
const decodeRE = /&(gt|lt|amp|apos|quot);/g;
const decodeMap: Record<string, string> = {
  gt: ">",
  lt: "<",
  amp: "&",
  apos: "'",
  quot: '"',
};

export const defaultParserOptions: Required<ParserOptions> = {
  delimiters: [`{{`, `}}`],
  decodeEntities: (rawText: string): string =>
    rawText.replace(decodeRE, (_, p1) => decodeMap[p1]),
  getTextMode: () => TextModes.DATA,
};

export const enum TextModes {
  //          | Elements | Entities | End sign               | Inside of
  DATA, //    | ✔        | ✔        | End tags of ancestors |
  RCDATA, //  | ✘        | ✔        | End tag of the parent | <textarea>
  RAWTEXT, // | ✘        | ✘        | End tag of the parent | <style>,<script>
  CDATA,
  ATTRIBUTE_VALUE,
}

export interface ParserContext {
  options: ParserOptions;
  readonly originalSource: string;
  source: string;
  offset: number;
  line: number;
  column: number;
}

export function baseParse(
  content: string,
  options: ParserOptions = {}
): RootNode {
  const context = createParserContext(content, options);
  return createRoot(parseChildren(context, TextModes.DATA, []));
}

function createParserContext(
  content: string,
  rawOptions: ParserOptions
): ParserContext {
  const options = { ...defaultParserOptions };

  let key: keyof ParserOptions;
  for (key in rawOptions) {
    // @ts-ignore
    options[key] =
      rawOptions[key] === undefined
        ? defaultParserOptions[key]
        : rawOptions[key];
  }
  return {
    options,
    column: 1,
    line: 1,
    offset: 0,
    originalSource: content,
    source: content,
  };
}

function parseChildren(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[]
): TemplateChildNode[] {
  const nodes: TemplateChildNode[] = [];

  while (!isEnd(context, mode, ancestors)) {
    const s = context.source;
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined;
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      if (startsWith(s, context.options.delimiters![0])) {
        node = parseInterpolation(context, mode);
      } else if (mode === TextModes.DATA && s[0] === "<") {
        if (/[a-z]/i.test(s[1])) {
          node = parseElement(context, ancestors);
        }
      }
    }

    if (!node) {
      node = parseText(context, mode);
    }

    if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i]);
      }
    } else {
      pushNode(nodes, node);
    }
  }

  return nodes;
}

function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode): void {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes);
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
    if (prev && prev.type === NodeTypes.TEXT) {
      prev.content += node.content;
      return;
    }
  }

  nodes.push(node);
}

function parseInterpolation(
  context: ParserContext,
  mode: TextModes
): InterpolationNode | undefined {
  const [open, close] = context.options.delimiters!;
  const closeIndex = context.source.indexOf(close, open.length);
  if (closeIndex === -1) return undefined;

  advanceBy(context, open.length);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  const rawContentLength = closeIndex - open.length;
  const rawContent = context.source.slice(0, rawContentLength);
  const preTrimContent = parseTextData(context, rawContentLength, mode);
  const content = preTrimContent.trim();
  const startOffset = preTrimContent.indexOf(content);
  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, rawContent, startOffset);
  }
  const endOffset =
    rawContentLength - (preTrimContent.length - content.length - startOffset);
  advancePositionWithMutation(innerEnd, rawContent, endOffset);
  advanceBy(context, close.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function parseText(context: ParserContext, mode: TextModes): TextNode {
  const endTokens = ["<", context.options.delimiters![0]];

  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex, mode);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseElement(
  context: ParserContext,
  ancestors: ElementNode[]
): ElementNode | undefined {
  // Start tag.
  const parent = last(ancestors);
  const element = parseTag(context, TagType.Start);

  // Children.
  ancestors.push(element);
  const mode = context.options.getTextMode!(element, parent);
  const children = parseChildren(context, mode, ancestors);
  ancestors.pop();

  element.children = children;

  // End tag.
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  }

  return element;
}

const enum TagType {
  Start,
  End,
}

function parseTag(context: ParserContext, type: TagType): ElementNode {
  // Tag open.
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)!;
  const tag = match[1];

  advanceBy(context, match[0].length);
  advanceSpaces(context);

  // Attributes.
  let props = parseAttributes(context, type);

  // Tag close.
  let isSelfClosing = false;

  isSelfClosing = startsWith(context.source, "/>");
  advanceBy(context, isSelfClosing ? 2 : 1);

  let tagType = ElementTypes.ELEMENT;

  if (tag === "template") {
    tagType = ElementTypes.TEMPLATE;
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    children: [],
  };
}

function parseAttributes(
  context: ParserContext,
  type: TagType
): (AttributeNode | DirectiveNode)[] {
  const props = [];
  const attributeNames = new Set<string>();
  while (
    context.source.length > 0 &&
    !startsWith(context.source, ">") &&
    !startsWith(context.source, "/>")
  ) {
    const attr = parseAttribute(context, attributeNames);

    // Trim whitespace between class
    // https://github.com/vuejs/core/issues/4251
    if (
      attr.type === NodeTypes.ATTRIBUTE &&
      attr.value &&
      attr.name === "class"
    ) {
      attr.value.content = attr.value.content.replace(/\s+/g, " ").trim();
    }

    if (type === TagType.Start) {
      props.push(attr);
    }

    advanceSpaces(context);
  }
  return props;
}

function parseAttribute(
  context: ParserContext,
  nameSet: Set<string>
): AttributeNode {
  // Name.
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!;
  const name = match[0];

  nameSet.add(name);

  advanceBy(context, name.length);

  // Value
  let value: AttributeValue = undefined;

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  };
}

function parseAttributeValue(context: ParserContext): AttributeValue {
  let content: string;

  const quote = context.source[0];
  const isQuoted = quote === `"` || quote === `'`;
  if (isQuoted) {
    // Quoted value.
    advanceBy(context, 1);

    const endIndex = context.source.indexOf(quote);
    if (endIndex === -1) {
      content = parseTextData(
        context,
        context.source.length,
        TextModes.ATTRIBUTE_VALUE
      );
    } else {
      content = parseTextData(context, endIndex, TextModes.ATTRIBUTE_VALUE);
      advanceBy(context, 1);
    }
  } else {
    // Unquoted
    const match = /^[^\t\r\n\f >]+/.exec(context.source);
    if (!match) {
      return undefined;
    }
    content = parseTextData(
      context,
      match[0].length,
      TextModes.ATTRIBUTE_VALUE
    );
  }

  return { content };
}

function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  const { source } = context;
  advancePositionWithMutation(context, source, numberOfCharacters);
  context.source = source.slice(numberOfCharacters);
}

function isEnd(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[]
): boolean {
  const s = context.source;

  switch (mode) {
    case TextModes.DATA:
      if (startsWith(s, "</")) {
        // TODO: probably bad performance
        for (let i = ancestors.length - 1; i >= 0; --i) {
          if (startsWithEndTagOpen(s, ancestors[i].tag)) {
            return true;
          }
        }
      }
      break;

    case TextModes.RCDATA:
    case TextModes.RAWTEXT: {
      const parent = last(ancestors);
      if (parent && startsWithEndTagOpen(s, parent.tag)) {
        return true;
      }
      break;
    }

    case TextModes.CDATA:
      if (startsWith(s, "]]>")) {
        return true;
      }
      break;
  }

  return !s;
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
}

function advanceSpaces(context: ParserContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}

/**
 * Get text data with a given length from the current location.
 * This translates HTML entities in the text data.
 */
function parseTextData(
  context: ParserContext,
  length: number,
  mode: TextModes
): string {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  if (
    mode === TextModes.RAWTEXT ||
    mode === TextModes.CDATA ||
    !rawText.includes("&")
  ) {
    return rawText;
  } else {
    // DATA or RCDATA containing "&"". Entity decoding required.
    return context.options.decodeEntities!(
      rawText,
      mode === TextModes.ATTRIBUTE_VALUE
    );
  }
}

function getCursor(context: ParserContext): Position {
  const { column, line, offset } = context;
  return { column, line, offset };
}

function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, "</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || ">")
  );
}
