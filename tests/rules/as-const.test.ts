import rule from "../../src/rules/as-const";
import { ruleTester } from "./tester";

ruleTester.run("as-const", rule, {
  valid: [

  ].map(entry => ({
    code: entry.toString(),
  })),
  invalid: [

  ].map(entry => ({
    code: entry.toString(),
    output: entry.toString() + " as const",
    errors: [{ messageId: "asConst" }],
  })),
});
