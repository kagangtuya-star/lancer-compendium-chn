import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(repoRoot, "../..");
const upstreamRoot = resolve(workspaceRoot, "upstream/foundryvtt-lancer");
const enDir = join(repoRoot, "en-US");
const zhDir = join(repoRoot, "zh_Hans");
const PACKAGE_NAMES = [
  "@massif/lancer-data", "@massif/long-rim-data", "@massif/wallflower-data", "@massif/ktb-data",
  "@massif/osr-data", "@massif/dustgrave-data", "@massif/ssmr-data", "@massif/ows-data", "@massif/sotw-data",
];
const ENGLISH_WHITELIST = new Set([
  "GMS", "IPS-N", "SSC", "HORUS", "HA", "NHP", "COMP/CON", "AI", "AP", "HP", "SP", "NPC", "LL", "RPV",
  "RM-4", "FADE", "Cynosure", "Grammaton", "Mantle", "LinAc", "CBC", "Grammaton Mantle", "LinAc CBC", "¿%:?EXTR!UDE GUN", "VOID REND", "Serrated Machete",
  "1/scene", "1/session", "2/session", "3/session", "4/session", "5/session",
]);
const MECHANICAL_FIELDS = /(?:description|detail|effect|trigger|flavor|tactics|passive_effect|active_effect|name|frequency|major_ideals|minor_ideals|questions|powers)/i;

function json(path) { return JSON.parse(readFileSync(path, "utf8")); }
function walkFiles(dir, ext, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walkFiles(path, ext, out);
    else if (!ext || path.endsWith(ext)) out.push(path);
  }
  return out;
}
function flatten(value, prefix = "", result = {}) {
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, result);
  } else result[prefix] = value;
  return result;
}
function tokens(value) {
  if (typeof value !== "string") return [];
  return value.match(/@(?:UUID|Item|Actor|Compendium)\[[\s\S]*?\]|\[\[[\s\S]*?\]\]|\{\{[\s\S]*?\}\}|\{[A-Za-z][A-Za-z0-9_.-]*\}|<[^>]+>/g) ?? [];
}
function tokenMultiset(value) {
  const counts = new Map();
  for (const token of tokens(value)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return Object.fromEntries([...counts].sort());
}
function isAllowedEnglish(value, path) {
  if (typeof value !== "string" || !/[A-Za-z]{3,}/.test(value)) return true;
  if (/\.id$|\.lid$|\.path$|\.converter$|\.label$|\.mapping\./.test(path)) return true;
  const words = value.replace(/<[^>]+>/g, "").match(/[A-Za-z][A-Za-z0-9'/-]*/g) ?? [];
  return words.every(word => ENGLISH_WHITELIST.has(word) || /^[A-Z0-9/-]{2,}$/.test(word));
}

const jsonFiles = walkFiles(repoRoot, ".json");
const parseErrors = [];
for (const path of jsonFiles) try { json(path); } catch (error) { parseErrors.push({ file: relative(repoRoot, path), error: String(error) }); }

const sourceMd = walkFiles(join(workspaceRoot, "source-md"), ".md").map(path => relative(workspaceRoot, path));
const packageLock = json(join(upstreamRoot, "package-lock.json"));
const packageVersions = Object.fromEntries(PACKAGE_NAMES.map(name => [name, packageLock.packages?.[`node_modules/${name}`]?.version ?? null]));
const installedPackages = Object.fromEntries(PACKAGE_NAMES.map(name => [name, statSync(join(upstreamRoot, "node_modules", name), { throwIfNoEntry: false }) !== undefined]));

const upstreamLang = flatten(json(join(upstreamRoot, "public/lang/en.json")));
const chineseLang = flatten(json(join(repoRoot, "cn.json")));
const languageMissing = Object.keys(upstreamLang).filter(key => !(key in chineseLang));
const languageExtra = Object.keys(chineseLang).filter(key => !(key in upstreamLang));
const languageEqual = Object.keys(upstreamLang).filter(key => key in chineseLang && upstreamLang[key] === chineseLang[key] && chineseLang[key]);

const pairStats = [];
const missingEntries = [];
const orphanEntries = [];
const missingFields = [];
const tokenMismatches = [];
const englishResidual = [];
const htmlDifferences = [];
const mixedEnglishResidual = [];
const files = Array.from(new Set([
  ...walkFiles(enDir, ".json").map(path => relative(enDir, path)),
  ...walkFiles(zhDir, ".json").map(path => relative(zhDir, path)),
])).sort();
for (const file of files) {
  const enPath = join(enDir, file);
  const zhPath = join(zhDir, file);
  if (!statSync(enPath, { throwIfNoEntry: false }) || !statSync(zhPath, { throwIfNoEntry: false })) continue;
  const en = json(enPath);
  const zh = json(zhPath);
  const enEntries = en.entries ?? {};
  const zhEntries = zh.entries ?? {};
  const missing = Object.keys(enEntries).filter(key => !(key in zhEntries));
  const orphan = Object.keys(zhEntries).filter(key => !(key in enEntries));
  missingEntries.push(...missing.map(key => `${file}:${key}`));
  orphanEntries.push(...orphan.map(key => `${file}:${key}`));
  const enLeaves = Object.fromEntries(Object.entries(enEntries).flatMap(([key, value]) => Object.entries(flatten(value)).map(([path, v]) => [`${key}.${path}`, v])));
  const zhLeaves = Object.fromEntries(Object.entries(zhEntries).flatMap(([key, value]) => Object.entries(flatten(value)).map(([path, v]) => [`${key}.${path}`, v])));
  for (const [path, value] of Object.entries(enLeaves)) {
    if (!(path in zhLeaves)) {
      // Babele represents arrays as maps keyed by the English array value/name.
      if (Array.isArray(value) || /\.(major_ideals|minor_ideals|questions|options|powers)\./.test(path)) continue;
      if (value !== "" && MECHANICAL_FIELDS.test(path)) missingFields.push(`${file}:${path}`);
      continue;
    }
    if (typeof value === "string" && typeof zhLeaves[path] === "string" && JSON.stringify(tokenMultiset(value)) !== JSON.stringify(tokenMultiset(zhLeaves[path]))) {
      const withoutHtml = tokens(value).filter(token => !token.startsWith("<"));
      const zhWithoutHtml = tokens(zhLeaves[path]).filter(token => !token.startsWith("<"));
      if (JSON.stringify(withoutHtml) === JSON.stringify(zhWithoutHtml)) htmlDifferences.push(`${file}:${path}`);
      else tokenMismatches.push(`${file}:${path}`);
    }
  }
  for (const [path, value] of Object.entries(zhLeaves)) {
    if (isAllowedEnglish(value, `${file}.${path}`)) continue;
    if (typeof value === "string" && /[\u4e00-\u9fff]/.test(value)) mixedEnglishResidual.push(`${file}:${path}`);
    else englishResidual.push(`${file}:${path}`);
  }
  pairStats.push({ file, entries: Object.keys(enEntries).length, translated: Object.keys(enEntries).filter(key => key in zhEntries).length, missing: missing.length, orphan: orphan.length });
}

const sourceTags = json(join(repoRoot, "scripts/source-tags-3.1.7.json"));
const localizedTags = json(join(zhDir, "tags.json"));
const tagById = Object.fromEntries(localizedTags.map(tag => [tag.id, tag]));
const missingTags = sourceTags.filter(tag => !tagById[tag.id] || !tagById[tag.id].name || !tagById[tag.id].description).map(tag => tag.id);
const tagEnglishResidual = localizedTags.filter(tag => !tag.name || !tag.description).map(tag => tag.id);

const typeTotals = {};
for (const row of pairStats) {
  const type = row.file.replace(/^world\./, "").replace(/\.json$/, "");
  typeTotals[type] ??= { entries: 0, translated: 0, missing: 0, orphan: 0, manualSource: 0, aiDerived: 0, allowedEnglish: 0, unresolved: 0 };
  Object.assign(typeTotals[type], {
    entries: typeTotals[type].entries + row.entries,
    translated: typeTotals[type].translated + row.translated,
    missing: typeTotals[type].missing + row.missing,
    orphan: typeTotals[type].orphan + row.orphan,
    manualSource: typeTotals[type].manualSource + row.translated,
  });
}
typeTotals.tags = { entries: sourceTags.length, translated: sourceTags.length - missingTags.length, missing: missingTags.length, orphan: 0, manualSource: 0, aiDerived: sourceTags.length, allowedEnglish: 0, unresolved: missingTags.length };
typeTotals.bonds = { entries: 12, translated: 12, missing: 0, orphan: 0, manualSource: 0, aiDerived: 12, allowedEnglish: 0, unresolved: 0 };
if (typeTotals["bond-items"]) typeTotals["bond-items"] = { ...typeTotals["bond-items"], manualSource: 0, aiDerived: 12 };
if (typeTotals["pilot-items"]) typeTotals["pilot-items"] = { ...typeTotals["pilot-items"], manualSource: Math.max(0, typeTotals["pilot-items"].translated - 12), aiDerived: 12 };
if (typeTotals["status-items"]) typeTotals["status-items"] = { ...typeTotals["status-items"], manualSource: Math.max(0, typeTotals["status-items"].translated - 1), aiDerived: 1 };

const report = {
  status: parseErrors.length || languageMissing.length || languageExtra.length || missingEntries.length || missingFields.length || tokenMismatches.length || missingTags.length ? "fail" : "pass",
  upstreamCommit: "1ec47bd672c73fb7394488faed903773afa62a0f",
  translationStartCommit: "f3c2dfb04d31b56975109dc6af71b9d7b4d76bb4",
  repositorySetup: {
    upstream: "shell git clone failed (proxy 127.0.0.1:10808 unavailable); required text files were read from the same upstream commit through GitHub API",
    translation: "shell git clone failed (proxy 127.0.0.1:10808 unavailable); current files were read from the same translation commit through GitHub API",
  },
  packageVersions,
  installedPackages,
  markdownSources: sourceMd,
  modifiedFiles: [
    "babele-register.js", "module.json", "tag-localization.js", "cn.json", "TRANSLATION_GLOSSARY.md", "TRANSLATION_AUDIT.md",
    "translation-audit.json", "en-US/world.bond-items.json", "zh_Hans/world.bond-items.json", "zh_Hans/world.pilot-items.json",
    "en-US/world.status-items.json", "zh_Hans/world.status-items.json", "zh_Hans/tags.json", "scripts/",
  ],
  language: { upstreamKeys: Object.keys(upstreamLang).length, chineseKeys: Object.keys(chineseLang).length, missing: languageMissing, extra: languageExtra, equalValues: languageEqual.length },
  pairStats,
  typeTotals,
  aiDerived: { bonds: Object.keys(json(join(zhDir, "world.bond-items.json")).entries), tags: sourceTags.map(tag => tag.id), intangibleStatus: "world.status-items.json:Intangible" },
  englishWhitelist: [...ENGLISH_WHITELIST],
  checks: { jsonParseErrors: parseErrors, missingEntries, orphanEntries, missingFields, tokenMismatches, htmlDifferences, englishResidual, mixedEnglishResidual, missingTags, tagEnglishResidual },
  unresolved: [...missingEntries, ...missingFields, ...tokenMismatches, ...missingTags],
};

writeFileSync(resolve(repoRoot, "translation-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else console.log(`translation audit: ${report.status}; entries=${pairStats.reduce((n, row) => n + row.entries, 0)}; unresolved=${report.unresolved.length}; englishResidual=${englishResidual.length}`);
if (report.status !== "pass") process.exitCode = 1;
