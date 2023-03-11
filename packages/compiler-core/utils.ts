import { Position } from "./ast";
import { CREATE_ELEMENT_VNODE, CREATE_VNODE } from "./runtimeHelpers";

export function advancePositionWithMutation(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length
): Position {
  let linesCount = 0;
  let lastNewLinePos = -1;
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++;
      lastNewLinePos = i;
    }
  }

  pos.offset += numberOfCharacters;
  pos.line += linesCount;
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : numberOfCharacters - lastNewLinePos;

  return pos;
}

export function getVNodeHelper(isComponent: boolean) {
  return isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}
