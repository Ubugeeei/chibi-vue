import {
  ArrayExpression,
  ComponentNode,
  DirectiveArguments,
  DirectiveNode,
  ElementNode,
  ElementTypes,
  NodeTypes,
  ObjectExpression,
  TemplateTextChildNode,
  VNodeCall,
  createArrayExpression,
  createVNodeCall,
} from "../ast";
import { NodeTransform, TransformContext } from "../transform";

export type PropsExpression = ObjectExpression;

export const transformElement: NodeTransform = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode!;

    if (
      !(
        node.type === NodeTypes.ELEMENT &&
        (node.tagType === ElementTypes.ELEMENT ||
          node.tagType === ElementTypes.COMPONENT)
      )
    ) {
      return;
    }

    const { tag, props } = node;
    const isComponent = node.tagType === ElementTypes.COMPONENT;
    let vnodeTag = isComponent
      ? resolveComponentType(node as ComponentNode, context)
      : `"${tag}"`;

    let vnodeProps: VNodeCall["props"];
    let vnodeChildren: VNodeCall["children"];
    let vnodeDirectives: VNodeCall["directives"];

    // props
    if (props.length > 0) {
      const propsBuildResult = buildProps(
        node,
        context,
        undefined,
        isComponent
      );
      vnodeProps = propsBuildResult.props;
      const directives = propsBuildResult.directives;
      vnodeDirectives =
        directives && directives.length
          ? (createArrayExpression(
              directives.map((dir) => buildDirectiveArgs(dir, context))
            ) as DirectiveArguments)
          : undefined;
    }

    // children
    if (node.children.length > 0) {
      if (node.children.length === 1) {
        const child = node.children[0];
        const type = child.type;
        // check for dynamic text children
        const hasDynamicTextChild = type === NodeTypes.INTERPOLATION;

        // pass directly if the only child is a text node
        // (plain / interpolation / expression)
        if (hasDynamicTextChild || type === NodeTypes.TEXT) {
          vnodeChildren = child as TemplateTextChildNode;
        } else {
          vnodeChildren = node.children;
        }
      } else {
        vnodeChildren = node.children;
      }
    }

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      vnodeDirectives,
      isComponent
    );
  };
};

export function resolveComponentType(
  node: ComponentNode,
  context: TransformContext
) {
  // TODO: implement
}

export function buildProps(
  node: ElementNode,
  context: TransformContext,
  props: ElementNode["props"] = node.props,
  isComponent: boolean
): { props: PropsExpression | undefined; directives: DirectiveNode[] } {
  // TODO: implement
}

export function buildDirectiveArgs(
  dir: DirectiveNode,
  context: TransformContext
): ArrayExpression {
  // TODO: implement
}
