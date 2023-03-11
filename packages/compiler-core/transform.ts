import { isArray, isString } from "../shared";
import { ParentNode, NodeTypes, RootNode, TemplateChildNode } from "./ast";
import { TransformOptions } from "./options";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

// There are two types of transforms:
//
// - NodeTransform:
//   Transforms that operate directly on a ChildNode. NodeTransforms may mutate,
//   replace or remove the node being processed.
export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: TransformContext
) => void | (() => void) | (() => void)[];

export interface TransformContext extends Required<TransformOptions> {
  helpers: Map<symbol, number>;
  currentNode: RootNode | TemplateChildNode | null;
  helper<T extends symbol>(name: T): T;
}

export function createTransformContext(
  root: RootNode,
  { nodeTransforms = [] }: TransformOptions
): TransformContext {
  const context: TransformContext = {
    helpers: new Map(),
    currentNode: root,
    nodeTransforms,
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
  };

  return context;
}

export function transform(root: RootNode, options: TransformOptions) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
}

export function traverseNode(
  node: RootNode | TemplateChildNode,
  context: TransformContext
) {
  context.currentNode = node;
  // apply transform plugins
  const { nodeTransforms } = context;
  const exitFns = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);
    if (onExit) {
      if (isArray(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }
    if (!context.currentNode) {
      // node was removed
      return;
    } else {
      // node may have been replaced
      node = context.currentNode;
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION: // no need to traverse, but we need to inject toString helper
      context.helper(TO_DISPLAY_STRING);
      break;

    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context);
      break;
  }

  // exit transforms
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

export function traverseChildren(
  parent: ParentNode,
  context: TransformContext
) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (isString(child)) continue;
    traverseNode(child, context);
  }
}
