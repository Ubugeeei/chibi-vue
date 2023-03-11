import { isString } from "../shared";
import { RootNode } from "./ast";
import { generate } from "./codegen";
import { baseParse } from "./parse";
import { DirectiveTransform, NodeTransform, transform } from "./transform";

import { transformElement } from "./transforms/transformElement";
import { transformOn } from "./transforms/vOn";
import { transformBind } from "./transforms/vBind";
import { transformText } from "./transforms/transformText";

export type TransformPreset = [
  NodeTransform[],
  Record<string, DirectiveTransform>
];

export function getBaseTransformPreset(): TransformPreset {
  return [
    [transformElement, transformText],
    {
      on: transformOn,
      bind: transformBind,
    },
  ];
}

export function baseCompile(template: string | RootNode) {
  // parse
  const ast = isString(template) ? baseParse(template) : template;

  // transform
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
  transform(ast, {
    nodeTransforms: [...nodeTransforms],
    directiveTransforms: { ...directiveTransforms },
  });

  // codegen
  return generate(ast);
}
