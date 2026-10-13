/** Ledger tools belong to the options preset composition, including blank-session mode switches. */
import { Ledger } from './ledger.js';
import { ledgerTools } from './integration.js';
export const name = 'options-ledger-tools';
export const inject = ['tools', 'systemPrompt', 'dshHomePath'];
/** Register scoped tools using the same SQLite database as the dashboard. */
export function apply(ctx) {
  const ledger = new Ledger(ctx.dshHomePath('data', 'options-ledger', 'ledger.sqlite'));
  ctx.effect(() => () => ledger.close(), 'options-ledger-tools: close storage');
  for (const tool of ledgerTools(ledger)) ctx.tools.register(tool);
  ctx.systemPrompt.section({ name: 'options-ledger:guide', order: 100, interpolate: false,
    text: "美股期权账本位于 Harness 左侧“期权账本”面板。回答真实持仓、权利金或成本问题前，先调用 options_ledger_read，引用实际返回数据；空账本不可推测。记录或修改数据时使用 options_ledger_propose，明确告知用户仍须在面板确认；不要直接修改 SQLite、HTML localStorage 或独立 JSON 文件充当入账。期初净权利金仅代表尚未逐笔录入的历史金额，避免重复扣减。CC部分股票行权：剩余名义成本=行权前名义总成本−交割股票原名义成本+max(交割股票原名义成本−交割收入,0)+股票交割手续费。全部出清时名义成本归零。多个批次必须确认交割批次成本；不猜测。可用 assign 草稿由用户确认后一次更新期权状态和持仓。" });
}
