import { parse as _parse } from "@babel/parser";
import { Statement, ObjectExpression, Node } from "@babel/types";

import { SFCDescriptor, SFCScriptBlock } from "./parse";
import { BindingMetadata, BindingTypes } from "../compiler-core";

export function compileScript(sfc: SFCDescriptor): SFCScriptBlock {
  let { script } = sfc;
  if (!script) {
    throw new Error(`[compiler-sfc] SFC contains no <script> tags.`);
  }

  try {
    let content = script.content;
    const scriptAst = _parse(content, {
      sourceType: "module",
    }).program;
    const bindings = analyzeScriptBindings(scriptAst.body);
    return {
      ...script,
      content,
      bindings,
      scriptAst: scriptAst.body,
    };
  } catch (e) {
    return script;
  }
}

function analyzeScriptBindings(ast: Statement[]): BindingMetadata {
  for (const node of ast) {
    if (
      node.type === "ExportDefaultDeclaration" &&
      node.declaration.type === "ObjectExpression"
    ) {
      return analyzeBindingsFromOptions(node.declaration);
    }
  }
  return {};
}

function analyzeBindingsFromOptions(node: ObjectExpression): BindingMetadata {
  const bindings: BindingMetadata = {};
  Object.defineProperty(bindings, "__isScriptSetup", {
    enumerable: false,
    value: false,
  });

  for (const property of node.properties) {
    if (
      property.type === "ObjectProperty" &&
      !property.computed &&
      property.key.type === "Identifier"
    ) {
      // computed & methods
      if (
        property.value.type === "ObjectExpression" &&
        (property.key.name === "computed" || property.key.name === "methods")
      ) {
        // methods: { foo() {} }
        // computed: { foo() {} }
        for (const key of getObjectExpressionKeys(property.value)) {
          bindings[key] = BindingTypes.OPTIONS;
        }
      }
    }

    // setup & data
    else if (
      property.type === "ObjectMethod" &&
      property.key.type === "Identifier" &&
      (property.key.name === "setup" || property.key.name === "data")
    ) {
      for (const bodyItem of property.body.body) {
        // setup() {
        //   return {
        //     foo: null
        //   }
        // }
        if (
          bodyItem.type === "ReturnStatement" &&
          bodyItem.argument &&
          bodyItem.argument.type === "ObjectExpression"
        ) {
          for (const key of getObjectExpressionKeys(bodyItem.argument)) {
            bindings[key] =
              property.key.name === "setup"
                ? BindingTypes.SETUP_MAYBE_REF
                : BindingTypes.DATA;
          }
        }
      }
    }
  }

  return bindings;
}

function getObjectExpressionKeys(node: ObjectExpression): string[] {
  const keys = [];
  for (const prop of node.properties) {
    if (prop.type === "SpreadElement") continue;
    const key = resolveObjectKey(prop.key, prop.computed);
    if (key) keys.push(String(key));
  }
  return keys;
}

export function resolveObjectKey(node: Node, computed: boolean) {
  switch (node.type) {
    case "StringLiteral":
    case "NumericLiteral":
      return node.value;
    case "Identifier":
      if (!computed) return node.name;
  }
  return undefined;
}
