import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const hooks = new Map();
globalThis.Hooks = {
  once(name, fn) { hooks.set(`once:${name}`, fn); },
  on(name, fn) { hooks.set(`on:${name}`, fn); },
};
let language = "cn";
const settings = new Map([
  ["lancer.tagConfig", {
    tg_burn: { lid: "tg_burn", val: "2", name: "Burn {VAL}", description: "English burn", hidden: false, filter_ignore: false },
    tg_custom: { lid: "tg_custom", val: "7", name: "Custom", description: "Keep me", hidden: true, filter_ignore: true },
  }],
]);
globalThis.game = {
  system: { id: "lancer" },
  i18n: { get lang() { return language; } },
  settings: {
    register(_scope, key, data) { if (!settings.has(`${_scope}.${key}`)) settings.set(`${_scope}.${key}`, data.default); },
    get(scope, key) { return settings.get(`${scope}.${key}`); },
    async set(scope, key, value) { settings.set(`${scope}.${key}`, JSON.parse(JSON.stringify(value))); },
  },
};
globalThis.fetch = async url => ({ ok: true, async json() { return JSON.parse(await readFile(fileURLToPath(new URL(`../zh_Hans/${url.split("/zh_Hans/")[1]}`, import.meta.url)), "utf8")); } });
await import("../tag-localization.js");
await hooks.get("once:init")();
await hooks.get("once:ready")();

let translated = settings.get("lancer.tagConfig");
assert.equal(translated.tg_burn.name, "燃烧 {VAL}");
assert.equal(translated.tg_burn.val, "2");
assert.deepEqual(translated.tg_custom, { lid: "tg_custom", val: "7", name: "Custom", description: "Keep me", hidden: true, filter_ignore: true });
const first = JSON.stringify(translated);
await globalThis.LancerCompendiumChnTags.localizeTags();
assert.equal(JSON.stringify(settings.get("lancer.tagConfig")), first, "repeated application is idempotent");

language = "en";
await globalThis.LancerCompendiumChnTags.localizeTags();
assert.equal(settings.get("lancer.tagConfig").tg_burn.name, "Burn {VAL}");
assert.equal(settings.get("lancer-compendium-chn.tagConfigBackup"), null);

language = "cn";
await globalThis.LancerCompendiumChnTags.localizeTags();
settings.set("lancer.tagConfig", { ...settings.get("lancer.tagConfig"), tg_burn: { lid: "tg_burn", val: "3", name: "Burn {VAL}", description: "New English", hidden: false, filter_ignore: false } });
await hooks.get("on:updateSetting")({ key: "lancer.tagConfig" });
assert.equal(settings.get("lancer.tagConfig").tg_burn.name, "燃烧 {VAL}");
assert.equal(settings.get("lancer-compendium-chn.tagConfigBackup").tg_burn.description, "New English");
console.log("tag localization mock tests passed");
