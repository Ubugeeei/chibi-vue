import {
  ElementNode,
  InterpolationNode,
  NodeTypes,
  Position,
  RootNode,
  TemplateChildNode,
  createRoot,
} from "./ast";
import { ParserOptions } from "./options";
import { advancePositionWithMutation } from "./utils";

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
        if (s[1] === "/") {
          // TODO: parse end tag
        } else if (/[a-z]/i.test(s[1])) {
          // TODO: parse start tag
        }
      }
    }
    if (!node) {
      // TODO: parse text
      // node = parseText(context, mode);
    }
  }

  // TODO:
  return [];
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
  // TODO:
  return false;
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
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
