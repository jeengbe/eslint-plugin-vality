import {
  arrayRequiresAsConst,
  isWithinAsConstContext,
  isWithinRequiresAsConstContext,
  objectRequiresAsConst,
  parentIsTrigger
} from "./nodeutils";
import { createRule } from "./utils";

export default createRule<[], "asConst">({
  create: (ctx) => ({
    ObjectExpression(node) {
      if (
        !isWithinAsConstContext(node) &&
        !isWithinRequiresAsConstContext(node) &&
        objectRequiresAsConst(node)
      ) {
        ctx.report({
          node,
          messageId: "asConst",
          fix(fixer) {
            return fixer.insertTextAfter(node, " as const");
          },
        });
      }
    },
    ArrayExpression(node) {
      if (
        !isWithinAsConstContext(node) &&
        !isWithinRequiresAsConstContext(node) &&
        (arrayRequiresAsConst(node) || parentIsTrigger(node))
      ) {
        ctx.report({
          node,
          messageId: "asConst",
          fix(fixer) {
            return fixer.insertTextAfter(node, " as const");
          },
        });
      }
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
