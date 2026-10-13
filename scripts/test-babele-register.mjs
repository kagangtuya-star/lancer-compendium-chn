import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

let converters;
const context = {
  Hooks: { once(_event, callback) { callback(); } },
  Babele: { get() { return { register() {}, registerConverters(value) { converters = value; } }; } },
  console,
};
vm.runInNewContext(readFileSync(new URL("../babele-register.js", import.meta.url), "utf8"), context);
const source = { lid: "bond_test", major_ideals: ["I act"], powers: [{ name: "Power", description: "Effect", uses: 2 }] };
const entry = {
  Bond: {
    bond_test: {
    major_ideals: { "I act": "我行动" },
    powers: { Power: { name: "能力", description: "效果" } },
    },
  },
};
const result = converters.generalConverter(source, null, { _id: "x", name: "Bond" }, { translations: entry });
assert.deepEqual(result.major_ideals, ["我行动"]);
assert.deepEqual(result.powers, [{ name: "能力", description: "效果", uses: 2 }]);
console.log("babele converter mock tests passed");
