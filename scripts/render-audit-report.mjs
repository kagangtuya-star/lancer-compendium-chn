import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(readFileSync(resolve(root, "translation-audit.json"), "utf8"));
const totals = Object.entries(report.typeTotals)
  .map(([type, row]) => `| ${type} | ${row.entries} | ${row.translated} | ${row.manualSource} | ${row.aiDerived} | ${row.allowedEnglish} | ${row.unresolved} |`)
  .join("\n");
const packages = Object.entries(report.packageVersions)
  .map(([name, version]) => `| ${name} | ${version ?? "未知"} | ${report.installedPackages[name] ? "是" : "否（npm ci 受网络阻塞）"} |`)
  .join("\n");
const markdown = `# LANCER 简体中文补全审计

状态：**${report.status.toUpperCase()}**（玩家机械内容未解决项：${report.unresolved.length}）

## 来源

- 上游仓库提交：\`${report.upstreamCommit}\`
- 汉化仓库起始提交：\`${report.translationStartCommit}\`
- 来源 Markdown：${report.markdownSources.map(file => `\`${file}\``).join("、")}
- 仓库准备：${report.repositorySetup.upstream}；${report.repositorySetup.translation}。

### 锁定的数据包版本

| 包 | package-lock 版本 | node_modules |
| --- | --- | --- |
${packages}

## 翻译覆盖统计

| 类型 | 英文条目 | 已译 | 人工来源 | AI 补译 | 允许英文 | 未解决 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${totals}

\`cn.json\` 与当前上游 \`public/lang/en.json\` 均为 ${report.language.upstreamKeys} 个有效键，缺失键 ${report.language.missing.length}，多余键 ${report.language.extra.length}。保留英文值 ${report.language.equalValues} 个，均属于系统枚举、厂商/型号或白名单术语。

## AI 补译与人工复核

- 新增并同步 12 条 KTB / Shadow of the Wolf 羁绊映射；其能力描述为 AI 补译，应结合来源规则书逐条复核。
- 新增 60 个官方标签的简中名称和规则描述；标签描述为 AI 补译，应重点核对数值、触发条件和边界条件。
- 新增 \`Intangible\`（无形）状态；文本依据来源 Markdown，仍建议核对与上游实现的一致性。
- 审计另记录 ${report.checks.mixedEnglishResidual.length} 个含专有名词的中英混排字段和 ${report.checks.htmlDifferences.length} 个既有 HTML 排版差异；未发现保护性引用、占位符或 \`[[...]]\` token 丢失。

英文保留白名单：${report.englishWhitelist.map(value => `\`${value}\``).join("、")}。

## Tag 本地化实现

\`tag-localization.js\` 在 \`ready\` 时仅对官方已知 tag lid 替换 \`name\` 与 \`description\`，把原始 \`tagConfig\` 保存到模块私有 world setting；非 \`cn\` 语言恢复原值，更新/重新导入时重新捕获官方条目，未知第三方 tag 原样保留。写入带递归保护且重复调用幂等，不触碰 \`lid\`、\`val\`、\`hidden\` 或 \`filter_ignore\`。

## 修改文件

机器可读清单见 \`translation-audit.json\` 的 \`modifiedFiles\`。

- \`babele-register.js\`：补充数组字符串和对象数组的稳定转换。
- \`module.json\`：注册 Tag 本地化脚本。
- \`tag-localization.js\`、\`zh_Hans/tags.json\`：实现可逆 Tag 本地化。
- \`zh_Hans/world.bond-items.json\`、\`en-US/world.bond-items.json\`：新增羁绊映射，并同步旧 \`world.pilot-items.json\`。
- \`en-US/world.status-items.json\`、\`zh_Hans/world.status-items.json\`：补充 \`Intangible\`。
- \`cn.json\`：与当前上游语言键对齐并补齐驾驶员导入、简洁字体设置键。
- \`TRANSLATION_GLOSSARY.md\`、\`scripts/\`：术语、生成器、审计和 mock 测试。

## 测试结果

- \`node scripts/generate-bond-mappings.mjs\`：通过。
- \`node scripts/generate-tag-localization.mjs\`：通过。
- \`node scripts/test-tag-localization.mjs\`：通过（语言切换、幂等、第三方 tag 保留、重新导入）。
- \`node scripts/test-babele-register.mjs\`：通过（数组字符串、对象数组和数值字段保持）。
- \`node scripts/audit-translations.mjs\`：${report.status}，未解决 ${report.unresolved.length}。
- \`npm ci --ignore-scripts\`：未完成；代理 \`127.0.0.1:10808\` 不可连接，故九个 \`@massif/*\` 包未安装。
- \`git diff --check\` / \`git status --short\`：工作区提供的 \`.git\` 目录没有 Git 元数据，命令返回 “Not a git repository”；未创建或初始化新的 Git 仓库。

## 剩余问题

当前环境无法安装锁定的官方 npm 数据包，因此审计使用上游仓库源码、现有英文基准、来源 Markdown 和已提供 LCP 中可读数据完成；完整官方包版本交叉审计需在可访问 npm registry 的环境重新运行本目录脚本。
\`world.npc-items.json\` 与部分旧机械 flavor 含中英混排专有名词，审计已列出路径，未擅自改写既有正常中文。
`;
writeFileSync(resolve(root, "TRANSLATION_AUDIT.md"), markdown);
