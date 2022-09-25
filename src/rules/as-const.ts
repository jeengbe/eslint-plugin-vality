import { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "./utils";

const NODES = TSESTree.AST_NODE_TYPES;

export default createRule<[], "asConst">({
  create: (ctx) => ({
    ObjectExpression(node) {
      // Needs 'as const' when
      // - is not already wrapped by 'as const'
      // - a property is a trigger
      // - a property needs 'as const'
      // - the parent does not need 'as const' (i.e. is not a nested object)

      if (isAsConst(node.parent)) return;
      if (!doesRequireAsConst(node)) return;

      ctx.report({
        node,
        messageId: "asConst",
        fix(fixer) {
          return fixer.insertTextAfter(node, " as const");
        },
      });
    },
    ArrayExpression(node) {
      // Needs 'as const' when
      // - is not already wrapped by 'as const'
      // - parent is a trigger

      if (isAsConst(node.parent)) return;
      if (node.parent?.type !== NODES.CallExpression) return;
      if (node.parent.callee.type !== NODES.MemberExpression || !isVality(node.parent.callee.object)) return;

      ctx.report({
        node,
        messageId: "asConst",
        fix(fixer) {
          return fixer.insertTextAfter(node, " as const");
        },
      });
    },
    Literal(node) {
      // Needs 'as const' when
      // - same as ArrayExpression

      if (isAsConst(node.parent)) return;
      if (node.parent?.type !== NODES.CallExpression) return;
      if (node.parent.callee.type !== NODES.MemberExpression || !isVality(node.parent.callee.object)) return;

      ctx.report({
        node,
        messageId: "asConst",
        fix(fixer) {
          return fixer.insertTextAfter(node, " as const");
        },
      });
    },
  }),
  name: "as-const",
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure that no 'as const' assertions are forgotten where they are necessary for correct type inference.",
      recommended: "error",
      requiresTypeChecking: true,
    },
    messages: {
      asConst: "Missing 'as const' assertion.",
    },
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
});

function doesRequireAsConst(
  node: TSESTree.Node,
  parentHasTrigger: boolean = false,
  showError: boolean = true
): boolean {
  switch (node.type) {
    case NODES.ObjectExpression: {
      /**
       * Whether the object is a Vality short
       */
      let hasTrigger = parentHasTrigger;

      if (!hasTrigger) {
        // Skip checking if the parent node is already a Vality short
        // First, we scan the object to check if it's a Vality short
        for (const prop of node.properties) {
          /* istanbul ignore next */
          if (prop.type === NODES.SpreadElement) continue;

          if (isTrigger(prop.value)) {
            hasTrigger = true;
            break;
          }
        }
        if (!hasTrigger) return false;
      }

      // And the we check if it needs an as const assertion
      for (const prop of node.properties) {
        /* istanbul ignore next */
        if (prop.type === NODES.SpreadElement) continue;

        if (doesRequireAsConst(prop.value, hasTrigger, false)) {
          return showError && hasTrigger;
        }
      }
      return false;
    }
    case NODES.Literal:
    case NODES.ArrayExpression:
      return true;
    default:
      return false;
  }
}

/**
 * Whether the precence of this node indicates that the its containing node is a Vality short
 */
function isTrigger(node: TSESTree.Node): boolean {
  switch (node.type) {
    case NODES.MemberExpression:
      // v.guard
      return isVality(node.object);
    case NODES.CallExpression:
      // v.valit() / v.guard()
      if (node.callee.type === NODES.MemberExpression) {
        return isVality(node.callee.object);
      }
      // v.valit()()
      if (
        node.callee.type === NODES.CallExpression &&
        node.callee.callee.type === NODES.MemberExpression
      ) {
        return isVality(node.callee.callee.object);
      }
    default:
      return false;
  }
}

/**
 * Whether the passed node is the Vality object
 */
 function isVality(node: TSESTree.Node): boolean {
  return (
    node.type === NODES.Identifier &&
    (node.name === "v" || node.name === "vality")
  );
}

/**
 * Whether the passed node is an 'as const' assertion
 */
function isAsConst(node: TSESTree.Node | undefined): boolean {
  return (
    node?.type === NODES.TSAsExpression &&
    node.typeAnnotation.type === NODES.TSTypeReference &&
    node.typeAnnotation.typeName.type === NODES.Identifier &&
    node.typeAnnotation.typeName.name === "const"
  );
}
