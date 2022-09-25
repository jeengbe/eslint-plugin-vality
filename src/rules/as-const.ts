import { createRule } from "./utils";

export default createRule<[], "asConst">({
  create: (ctx) => ({}),
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
