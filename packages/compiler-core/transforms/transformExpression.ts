import {
  NodeTypes,
  SimpleExpressionNode,
  createSimpleExpression,
} from "../ast";
import { NodeTransform } from "../transform";

export const transformExpression: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content as SimpleExpressionNode);
  } else if (node.type === NodeTypes.ELEMENT) {
    for (let i = 0; i < node.props.length; i++) {
      const dir = node.props[i];
      if (dir.type === NodeTypes.DIRECTIVE) {
        const exp = dir.exp;
        const arg = dir.arg;

        if (exp && exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          dir.exp = processExpression(exp);
        }

        if (arg && arg.type === NodeTypes.SIMPLE_EXPRESSION && !arg.isStatic) {
          dir.arg = processExpression(arg);
        }
      }
    }
  }
};

export function processExpression(
  node: SimpleExpressionNode
): SimpleExpressionNode {
  // TODO: walk tree and process expressions
  return createSimpleExpression(`_ctx.${node.content}`);
}
