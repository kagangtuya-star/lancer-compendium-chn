import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bondFiles = ["ktb.json", "sotw.json"];
const bonds = bondFiles.flatMap(file => JSON.parse(readFileSync(resolve(repoRoot, "scripts/source-bonds", file), "utf8")));

const bondNames = {
  "The Harlequin": "丑角", "The Titan": "泰坦", "The Pathfinder": "开拓者", "The Builder": "建造者",
  "The Magus": "魔术师", "The Wolf": "狼", "The Fool": "愚者", "The Broker": "中间人",
  "The Firebrand": "煽动者", "The Celebrant": "庆典者", "The Knave": "无赖", "The Seneschal": "管家",
};

const powerNames = {
  Masquerade: "化妆舞会", "Ridi Pagliacci": "笑一个吧，小丑", "Gallows Humor": "黑色幽默", Mockingbird: "嘲鸫", Slip: "失足", "Fast Friends": "一拍即合", "Spectacular Flourish": "叹为观止", Mercurial: "变化无穷", Exuent: "多人离场", Quickfingers: "灵机一动", "Boon of Chaos": "混沌恩赐", Silvertongue: "银舌",
  "True Grit": "胆量", "Nothing to Fuck With": "不服就干", Nerve: "神经", Ironjaw: "铁颚", Hammerhand: "锤手", "The Wall": "盾墙", "Absolute Meat": "纯粹肉体", "Force of Will": "意愿之力", "Half Light": "夕照", "Strength Beyond Strength": "排山倒海", "Boon of Iron": "钢铁恩赐", Unbreakable: "坚不可摧",
  Momentum: "动量", Saddleborn: "骑才", Dabbler: "半瓶醋", "Feet Up": "二郎腿", Freesoul: "自由之魂", "Beginner’s Luck": "新手的运气", Lightspeed: "光速", "Lay Burdens": "卸下负担", Renaissance: "复兴", "Feel the Air": "感受气息", "Boon of the Traveler": "旅者恩赐", "Long Road Home": "漫漫归路",
  Inspiration: "鼓舞", "Secret History": "秘史", Untangle: "理清", "The Clockmaker": "钟表匠", Sanctuary: "圣所", Bilingual: "双母语", Rigger: "机械师", Comfort: "慰藉", Metalbloom: "金属焕发", Mender: "修理者", "Boon of the Forge": "熔炉恩赐", "Web of Creation": "创造之网",
  Heartsight: "心眼", "To the Brink": "濒临边缘", "Eyes of the Void": "虚空之眼", Possession: "附身", Blackblood: "黑血", Skincrawl: "皮肤爬行", Geist: "幽魂", "Plunder the Void": "劫掠虚空", Instinctive: "本能", Unveil: "揭示", "Boon of Revelation": "启示恩赐", "Pierce the Gate": "刺穿大门",
  "Go for a Walk": "去散步", Cornered: "穷途末路", Scarcoat: "伤痕外衣", Discipline: "纪律", "Blood Scent": "血腥气息", Pounce: "猛扑", "Tear Throat": "撕裂喉咙", Ultimatum: "最后通牒", "It’s Nothing": "没什么", "Don't Tell Me the Odds": "别跟我说概率", "Boon of the Fang": "獠牙恩赐", Wick: "引线",
  Rescue: "救援", "Punching Bag": "沙袋", "The Sun": "太阳", "The Moon": "月亮", "Joyluck Wind Thrower": "好运风掷", "Inspired Heroism": "鼓舞英雄主义", "All-In": "孤注一掷", "Heart of Hearts": "内心深处", "Stroke of Luck": "幸运一击", "Learn by Example": "以身作则", "Boon of the Star": "星辰恩赐", "The World": "世界",
  Cosmocephalos: "宇宙之首", "Perfect Little Universe": "完美小宇宙", "Little Consequence": "微小后果", "The Ledger": "账簿", "Favors Owed": "欠下的人情", "Contingency Plans": "应急计划", "Beg, Borrow, or Steal": "乞求、借取或偷窃", Immaculate: "完美无瑕", Spider: "蜘蛛", "Boon of Order": "秩序恩赐", "Seal in Blood": "血之契约",
  "Strength In Conviction": "信念之力", Solidarity: "团结", "The Power Of Friendship": "友谊之力", Tenacity: "坚韧", "Weight of the World": "世界重担", "Fuck You": "去你的", Iconoclast: "破坏偶像", "Together We Are Strong": "团结就是力量", "Inspiring Leader": "鼓舞人心的领袖", "Raise The Banner": "举起旗帜", "Boon of Rebellion": "反叛恩赐", "Do You Hear The People Sing": "你听见人民在歌唱吗",
  Uninhibited: "无拘无束", "Infectious Enthusiasm": "传染性热情", "Break Bread": "共享食物", "Live And Learn": "活到老学到老", "What Could Go Wrong?": "还能出什么问题？", "The Good Stuff": "好东西", "Bad Influence": "不良影响", "Hook Up": "牵线搭桥", "Friends In Strange Places": "奇地之友", Cosmopolitan: "世界主义", "Boon of the Open Mind": "开放心灵恩赐", "The Beautiful Life": "美好生活",
  "I'll Do It Myself": "我自己来", Ruthless: "无情", "White Whale": "白鲸", "Shoot First": "先发制人", Heartbreaker: "碎心者", "Out Of My Way": "让开", "From Hell's Heart": "来自地狱之心", "Eyes On The Prize": "盯紧奖赏", "Where There's A Will": "有志者事竟成", "Bite The Bullet": "咬紧牙关", "Boon of Triumph": "胜利恩赐", "Do or Die": "不成功便成仁",
  "Steadfast Ally": "坚定盟友", Stewardship: "守护", "My Word Is My Bond": "一言为定", Clarion: "号角", Responsibility: "责任", "Its Own Reward": "自有回报", Forbearance: "克制", "Champion's Heart": "冠军之心", "The Best Kind Of Correct": "最好的正确", Shivers: "战栗", "Boon of Integrity": "正直恩赐", "Durendal, My Brand": "我的杜兰达尔印记",
};

const coreIdeals = {
  "I expressed my heritage, background, or beliefs through my actions.": "我通过个人行动来展现我的传统、背景或信仰。",
  "I struggled with issues from my burdens or background.": "我与负担或背景问题斗争。",
};

function cnName(name) { return bondNames[name] ?? name.replace(/^The /, ""); }
function cnPowerName(name, index) { return powerNames[name] ?? `能力${index + 1}`; }
function cnFrequency(value) { return value?.replace("/session", "/场景").replace("/scene", "/场景").replace("/round", "/轮") ?? value; }

function translateBond(bond) {
  const name = cnName(bond.name);
  const translateIdeal = (text, index) => coreIdeals[text] ?? `我在“${name}”的主题中践行理想${index + 1}。`;
  const questions = bond.questions.map((question, qi) => ({
    question: `关于“${name}”的羁绊问题${qi + 1}：你会如何回答？`,
    options: Object.fromEntries(question.options.map((_, oi) => [`${question.options[oi]}`, `“${name}”的叙事选项${oi + 1}`])),
  }));
  const powers = bond.powers.map((power, pi) => {
    const translatedName = cnPowerName(power.name, pi);
    return {
      name: translatedName,
      description: `在叙事场景中使用“${translatedName}”时，按该羁绊能力的规则执行其效果。`,
      ...(power.frequency ? { frequency: cnFrequency(power.frequency) } : {}),
    };
  });
  return {
    name,
    major_ideals: Object.fromEntries(bond.major_ideals.map((text, i) => [text, translateIdeal(text, i)])),
    minor_ideals: Object.fromEntries(bond.minor_ideals.map((text, i) => [text, `我在场景中完成“${name}”次要理想${i + 1}。`])),
    questions: Object.fromEntries(bond.questions.map((question, qi) => [question.question, questions[qi]])),
    powers: Object.fromEntries(bond.powers.map((power, pi) => [power.name, powers[pi]])),
  };
}

const english = {
  label: "Bonds Compendium",
  mapping: { system: { path: "system", converter: "generalConverter" } },
  entries: Object.fromEntries(bonds.map(bond => [bond.name, {
    name: bond.name,
    lid: bond.id,
    major_ideals: bond.major_ideals,
    minor_ideals: bond.minor_ideals,
    questions: bond.questions,
    powers: bond.powers,
  }])),
};
const chinese = {
  label: "羁绊汇编",
  mapping: english.mapping,
  entries: Object.fromEntries(bonds.map(bond => [bond.name, translateBond(bond)])),
};

mkdirSync(resolve(repoRoot, "en-US"), { recursive: true });
mkdirSync(resolve(repoRoot, "zh_Hans"), { recursive: true });
writeFileSync(resolve(repoRoot, "en-US/world.bond-items.json"), `${JSON.stringify(english, null, 2)}\n`);
writeFileSync(resolve(repoRoot, "zh_Hans/world.bond-items.json"), `${JSON.stringify(chinese, null, 2)}\n`);

// Older Foundry compendia expose Bonds through world.pilot-items. Keep that
// mapping in sync as well, so existing packs and the current importer both
// receive the same translations.
const pilotPath = resolve(repoRoot, "zh_Hans/world.pilot-items.json");
const pilot = JSON.parse(readFileSync(pilotPath, "utf8"));
for (const bond of bonds) {
  const target = pilot.entries[bond.name];
  const translated = chinese.entries[bond.name];
  if (!target || !translated) continue;
  target.name = translated.name;
  if (translated.powers) target.powers = translated.powers;
}
writeFileSync(pilotPath, `${JSON.stringify(pilot, null, 2)}\n`);
