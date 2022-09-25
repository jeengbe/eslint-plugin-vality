import rule from "../../src/rules/as-const";
import { ruleTester } from "./tester";
import { permute } from "./utils";

const v = ["v", "vality"];
const trigger = permute`${v}.${["something", "something()", "something()()"]}`;
const literals = [1, `"foo"`, true];
const requires = [
  ...literals,
  ...permute`[ ${literals} ]`,
  ...permute`[ ${literals}, ${literals} ]`,
];

ruleTester.run("as-const", rule, {
  valid: [
    "({})",
    ...permute`({ foo: ${trigger}, bar: ${trigger}})`,
    "[]",
    ...requires,
    ...permute`({ foo: ${trigger}, bar: ${requires}} as const)`,
    ...permute`${v}.something(${requires} as const)`,
    ...permute`${v}.something(${requires} as const)()`,
    ...permute`${v}.something(${permute`{ foo: ${trigger}, bar: ${requires}}`} as const)()`,
    ...permute`[ ${requires}, ${requires} ]`,
    ...permute`({ foo: ${requires} })`,
    ...permute`({ foo: ${requires}, bar: ${requires} })`,
    ...permute`someMethod(${requires})`,
  ].map((entry) => ({
    code: entry.toString(),
  })),
  invalid: [
    {
      code: permute`({ foo: ${trigger}, bar: ${requires}})`,
      output: permute`({ foo: ${trigger}, bar: ${requires}} as const)`,
    },
    {
      code: permute`${v}.something(${requires})`,
      output: permute`${v}.something(${requires} as const)`,
    },
    {
      code: permute`${v}.something(${requires})()`,
      output: permute`${v}.something(${requires} as const)()`,
    },
    {
      code: permute`${v}.something(${permute`{ foo: ${trigger}, bar: ${requires}}`})()`,
      output: permute`${v}.something(${permute`{ foo: ${trigger}, bar: ${requires}}`} as const)()`,
    },
  ].map(mapInvalidEntry).flat(),
});

function mapInvalidEntry(
  entry:
    | string
    | { code: string[]; output: string[] }
    | { code: string; output: string }
) {
  if (typeof entry === "string") {
    return {
      code: entry,
      output: entry + " as const",
      errors: [{ messageId: "asConst" as const }],
    };
  }
  if (typeof entry.code !== "string") {
    return entry.code.map((code, i) =>
      mapInvalidEntry({ code, output: entry.output[i] })
    );
  }
  return {
    ...entry,
    errors: [{ messageId: "asConst" as const }],
  };
}

// ruleTester.run("as-const", rule, {
//   valid: [].map((entry) => ({
//     code: entry.toString(),
//   })),
//   invalid: [
//     {
//       code: `vality.something([ true, "foo" ])()`,
//       output: `vality.something([ true, "foo" ] as const)()`,
//       errors: [{ messageId: "asConst" }],
//     }
//   ],
// });
