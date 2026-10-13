import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(resolve(root, "scripts/source-tags-3.1.7.json"), "utf8"));
const names = {
  tg_burn: "燃烧 {VAL}", tg_heat_target: "热量 {VAL}（目标）", tg_line: "线形 {VAL}", tg_cone: "锥形 {VAL}",
  tg_blast: "爆炸 {VAL}", tg_burst: "爆发 {VAL}", tg_accurate: "精准", tg_arcing: "弧线", tg_ap: "穿甲（AP）",
  tg_inaccurate: "不精准", tg_knockback: "击退 {VAL}", tg_loading: "装填", tg_ordnance: "军械", tg_overkill: "杀绝",
  tg_overshield: "护盾", tg_reliable: "可靠 {VAL}", tg_seeking: "追踪", tg_smart: "智能", tg_threat: "威胁 {VAL}",
  tg_thrown: "投掷 {VAL}", tg_turn: "{VAL}/回合", tg_round: "{VAL}/轮", tg_ai: "AI", tg_danger_zone: "超温危域",
  tg_deployable: "可展开", tg_drone: "无人机", tg_full_action: "完整动作", tg_grenade: "榴弹", tg_heat_self: "热量 {VAL}（自身）",
  tg_limited: "受限 {VAL}", tg_mine: "地雷", tg_mod: "模组", tg_protocol: "协议", tg_quick_action: "快速动作",
  tg_reaction: "反应", tg_shield: "护盾", tg_unique: "独特", tg_archaic: "古旧", tg_personal_armor: "个人护甲",
  tg_pilot_weapon: "驾驶员武器", tg_gear: "装备", tg_sidearm: "副武器", tg_invade: "入侵", tg_quick_tech: "快速科技",
  tg_full_tech: "完整科技", tg_free_action: "自由动作", tg_range: "射程（{VAL}）", tg_modded: "已加装模组", tg_resistance: "抗性",
  tg_exotic: "异种装备", tg_recharge: "重充 {VAL}+", tg_unlimited: "无限", tg_indestructible: "不可毁坏", tg_invulnerable: "无敌",
  tg_invisible: "隐形", tg_resistall: "全伤害抗性", tg_set_max_uses: "设定最大用量", tg_set_damage_type: "设定伤害类型",
  tg_set_damage_value: "设定伤害数值", tg_no_cascade: "防止层流",
};

const descriptions = {
  tg_burn: "命中时，该武器对目标造成 {VAL} 燃烧；目标立即承受等量燃烧伤害（忽略装甲），并在角色卡上标记 {VAL} 燃烧。回合结束时，标记燃烧的角色进行工程检定，成功清除标记，失败则承受等同总标记值的伤害。",
  tg_heat_target: "命中时，该武器或系统使目标获得 {VAL} 热量。",
  tg_line: "该武器的攻击影响一条长度为 {VAL} 空间的直线。", tg_cone: "该武器的攻击影响长度为 {VAL}、末端宽度为 {VAL} 的锥形区域，起点宽度为1。",
  tg_blast: "该武器的攻击影响射程和视线内一点周围半径 {VAL} 的角色；掩护和视线以爆炸中心计算。",
  tg_burst: "该武器的攻击影响以使用者（或目标）空间为中心、半径 {VAL} 的区域；持续效果随中心角色移动。",
  tg_accurate: "使用该武器进行的攻击获得 +1 准度。", tg_arcing: "该武器可越过障碍发射；只要能追踪路径就不要求视线，但仍受掩护影响。",
  tg_ap: "该武器造成的伤害忽略装甲。", tg_inaccurate: "使用该武器进行的攻击获得 +1 难度。",
  tg_knockback: "命中时，使用者可将目标沿远离起点的直线击退 {VAL} 空间；多个击退效果叠加。",
  tg_loading: "该武器每次使用后都必须装填；机甲可通过稳住阵脚或部分系统装填。",
  tg_ordnance: "该武器只能在使用者移动或进行其他动作前发射（协议除外）；交战中的目标不能成为目标，也不能用于守望。",
  tg_overkill: "掷该武器伤害时，掷出1的骰子使攻击者受到1热量并重掷；后续的1仍触发此效果。",
  tg_overshield: "该系统提供场景结束或满足指定条件时消失的额外HP；只保留最高值，不可叠加，伤害先扣除护盾。",
  tg_reliable: "即使未命中或伤害掷骰较低，该武器也总是造成 {VAL} 伤害；可靠伤害继承穿甲等伤害标签。",
  tg_seeking: "该武器具有有限的自动寻的能力；只要能追踪路径，就忽略掩护且不要求视线。",
  tg_smart: "该武器的攻击使用目标的电子防御而非回避；没有电子防御的目标视为8。",
  tg_threat: "该武器可在 {VAL} 空间内进行守望攻击；若为近战武器，可在 {VAL} 空间内进行近战攻击。",
  tg_thrown: "该近战武器可投掷至 {VAL} 空间内的目标；投掷后须在邻近空间以自由动作取回。",
  tg_turn: "该系统、特征或反应每回合最多使用 {VAL} 次。", tg_round: "该系统、特征或反应在使用者两次回合开始之间最多使用 {VAL} 次。",
  tg_ai: "机甲同时只能安装一个带此标签的系统；带AI的机甲可由NHP或COMP/CON半自主控制，不能从天赋受益。",
  tg_danger_zone: "使用者必须处于超温危域（热量至少达到热量上限的一半）才能使用。",
  tg_deployable: "该系统是可部署到战场的物体；除非另有说明，快速动作可将其部署在邻近的有效空位。",
  tg_drone: "这是具备有限自主性的无人单位；除非另有说明，无人机为大小1/2、10回避、5HP、0装甲的盟友。",
  tg_full_action: "激活该系统需要完整动作。", tg_grenade: "快速动作：将该爆炸物投掷至视线内、指定射程内的空间。",
  tg_heat_self: "使用该武器或系统后，使用者立即受到 {VAL} 热量。", tg_limited: "该武器或系统在全面维修前只能使用 {VAL} 次。",
  tg_mine: "快速动作：将地雷部署在邻近的有效空位；角色进入邻近空间时触发并产生爆发攻击。",
  tg_mod: "该模组可应用于武器；每件武器最多一个模组，装配机甲或全面维修时应用。",
  tg_protocol: "该系统可在使用者回合开始时以自由动作激活，停用可能需要其他动作。",
  tg_quick_action: "激活该系统需要快速动作。", tg_reaction: "该系统可作为反应激活。", tg_shield: "该系统是一种能量护盾。",
  tg_unique: "该武器或系统不可复制；每个角色同时只能安装一份。", tg_archaic: "该武器过时，无法伤害机甲。",
  tg_personal_armor: "该装备提供明显且通常无法隐藏的战斗防护；驾驶员同一时间只能穿戴一件。",
  tg_pilot_weapon: "任务中驾驶员最多携带两件驾驶员规模武器；机甲不能使用。", tg_gear: "这是工具或装备；驾驶员最多同时拥有三件。",
  tg_sidearm: "该武器可用快速动作进行战斗，而非完整动作。", tg_invade: "该系统为入侵快速科技动作提供额外选项。",
  tg_quick_tech: "该科技可作为快速科技动作使用。", tg_full_tech: "该科技可作为完整科技动作使用。",
  tg_free_action: "自由动作可在回合任意时点进行，不计入快速或完整动作次数。", tg_range: "该系统可在 {VAL} 空间射程内激活。",
  tg_modded: "该武器已装配武器模组。", tg_resistance: "将你具有抗性的伤害来源造成的所有伤害减半。",
  tg_exotic: "异种装备是传统牌照系统之外的装备。", tg_recharge: "使用后必须重充；NPC回合开始掷1d6，结果至少为 {VAL} 时恢复使用。",
  tg_unlimited: "该能力每轮可使用任意次数。", tg_indestructible: "该装备不能被标记为被毁。", tg_invulnerable: "该装备免疫所有伤害。",
  tg_invisible: "该单位处于隐形状态。", tg_resistall: "该单位对所有伤害类型具有抗性。",
  tg_set_max_uses: "允许玩家设置该装备的最大用量（隐藏标签）。", tg_set_damage_type: "允许玩家设置该装备的伤害类型（隐藏标签）。",
  tg_set_damage_value: "允许玩家设置该装备的伤害数值（隐藏标签）。", tg_no_cascade: "禁止AI系统被识别为层流的有效目标（隐藏标签）。",
};

const localized = source.map(tag => ({
  ...tag,
  name: names[tag.id] ?? `标签 ${tag.id}`,
  description: descriptions[tag.id] ?? "该标签提供其规则定义的效果。",
}));
writeFileSync(resolve(root, "zh_Hans/tags.json"), `${JSON.stringify(localized, null, 2)}\n`);
