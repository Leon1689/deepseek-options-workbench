/** Persistent USD options ledger. Money is stored as integer cents; all writes are transactional. */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export class LedgerError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const fail = message => { throw new LedgerError(message); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, limit = 500) => typeof value === 'string' && value.length <= limit ? value.trim() : fail('文本缺失或过长');
export function symbolOf(value) {
  const symbol = text(value, 24).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.\-^/]{0,23}$/.test(symbol)) fail('标的代码只能包含字母、数字、点、横线、斜线或 ^');
  return symbol;
}
function number(value, label) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') fail(`${label}不能为空`);
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > 1e12) fail(`${label}超出有效范围`);
  return n;
}
function cents(value, label, signed = false) {
  const n = number(value, label);
  if (!signed && n < 0) fail(`${label}不能为负数`);
  const result = Math.round(n * 100);
  if (Math.abs(result / 100 - n) > 1e-7) fail(`${label}最多保留两位小数，按整笔美元金额填写`);
  return result;
}
function dateOf(value) {
  const d = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0, 10) !== d) fail('日期无效');
  return d;
}
function positionOf(p) {
  if (!object(p)) fail('持仓格式错误');
  const shares = number(p.shares, '股数');
  if (shares < 0 || Math.abs(Math.round(shares * 1e6) / 1e6 - shares) > 1e-9) fail('股数必须非负且最多六位小数');
  const nominalCostCents = cents(p.nominalCost, '名义总成本');
  if (shares === 0 && nominalCostCents !== 0) fail('无持仓时名义总成本应为 0');
  return { symbol: symbolOf(p.symbol), shares, nominalCostCents,
    openingNetCents: cents(p.openingNetPremium ?? 0, '期初累计净权利金', true),
    asOf: dateOf(p.asOf), note: text(p.note ?? '') };
}
function tradeOf(t) {
  if (!object(t)) fail('交易格式错误');
  if (!['CSP', 'CC'].includes(t.strategy)) fail('策略应为 CSP 或 CC');
  if (!['open', 'closed', 'expired', 'assigned'].includes(t.status)) fail('请选择期权状态');
  const contracts = number(t.contracts, '合约数');
  if (!Number.isInteger(contracts) || contracts < 1) fail('合约数必须为正整数');
  const grossCents = cents(t.openPremium, '卖出权利金');
  const buybackCents = cents(t.buybackCost ?? 0, '买回支出');
  const feesCents = cents(t.fees ?? 0, '手续费');
  if (t.status === 'open' && buybackCents > 0) fail('存在买回支出时请选择已平仓状态；部分平仓请拆分为两笔');
  const id = t.id ? text(t.id, 120) : randomUUID();
  if (!/^[\w-]+$/.test(id)) fail('交易编号无效');
  return { id, symbol: symbolOf(t.symbol), strategy: t.strategy, status: t.status, contracts,
    grossCents, buybackCents, feesCents, date: dateOf(t.date), note: text(t.note ?? ''),
    ...(t.assignment ? {assignment: assignmentRecord(t.assignment)} : {}) };
}
function assignmentRecord(value) {
  if (!object(value)) fail('行权记录无效');
  const result={date:dateOf(value.date)};
  for (const key of ['shares','multiplier','strikeCents','stockFeesCents','removedCostCents','lossTransferredCents','beforeShares','beforeNominalCents','afterShares','afterNominalCents']) {
    const n=number(value[key],key);
    if(n<0 || (key.endsWith('Cents') && !Number.isSafeInteger(n))) fail('行权记录金额无效');
    result[key]=n;
  }
  return result;
}

/** Preview an actual full-trade assignment; stock loss transfers only to shares still held. */
export function previewAssignment(state, input) {
  if(!object(input)) fail('行权参数缺失');
  const trade=state.trades.find(t=>t.id===input.tradeId);
  if(!trade || trade.status!=='open' || trade.assignment) fail('只能处理尚未行权的未平仓交易；部分合约行权请先拆分交易');
  const strikeCents=cents(input.strike,'行权执行价'), stockFeesCents=cents(input.stockFees??0,'股票交割手续费');
  const multiplier=number(input.multiplier,'每张合约股数');
  if(!Number.isInteger(multiplier)||multiplier<1||multiplier>1000000) fail('合约乘数必须为正整数');
  const shares=trade.contracts*multiplier, proceeds=shares*strikeCents;
  if(!Number.isSafeInteger(proceeds)||!Number.isSafeInteger(shares)) fail('行权金额或数量过大');
  const before=state.positions[trade.symbol];
  if(trade.strategy==='CC' && (!before || before.shares<shares)) fail('已核对的持仓不足以交割');
  const beforeShares=before?.shares??0, beforeNominalCents=before?.nominalCostCents??0;
  let removedCostCents=0,lossTransferredCents=0,afterShares,afterNominalCents;
  if(trade.strategy==='CSP') {
    afterShares=beforeShares+shares;afterNominalCents=beforeNominalCents+proceeds+stockFeesCents;
  } else {
    removedCostCents=cents(input.assignedNominalCost,'交割股票原名义总成本');
    if(removedCostCents>beforeNominalCents) fail('交割股票原成本不能超过总持仓成本');
    afterShares=Math.round((beforeShares-shares)*1e6)/1e6;
    if(afterShares===0 && removedCostCents!==beforeNominalCents) fail('全部出清时交割股票原成本应等于持仓总成本');
    lossTransferredCents=afterShares>0?Math.max(0,removedCostCents-proceeds):0;
    afterNominalCents=afterShares>0?beforeNominalCents-removedCostCents+lossTransferredCents+stockFeesCents:0;
  }
  if(!Number.isSafeInteger(afterNominalCents)) fail('行权后成本过大');
  const record=assignmentRecord({date:input.asOf,shares,multiplier,strikeCents,stockFeesCents,removedCostCents,lossTransferredCents,beforeShares,beforeNominalCents,afterShares,afterNominalCents});
  const net=summarize(state).rows.find(r=>r.symbol===trade.symbol)?.netPremium??0;
  return {tradeId:trade.id,symbol:trade.symbol,strategy:trade.strategy,record,
    position:{symbol:trade.symbol,shares:afterShares,nominalCostCents:afterNominalCents,openingNetCents:before?.openingNetCents??0,asOf:record.date,note:before?.note??''},
    netPremium:net,actualPerShare:afterShares>0?(afterNominalCents/100-net)/afterShares:null};
}
const empty = () => ({ version: 2, revision: 0, positions: {}, trades: [], proposals: [] });

/** Derive views from confirmed cash flows. No cross-symbol cost attribution. */
export function summarize(state) {
  const symbols = [...new Set([...Object.keys(state.positions), ...state.trades.map(t => t.symbol)])].sort();
  const rows = symbols.map(symbol => {
    const p = state.positions[symbol];
    const trades = state.trades.filter(t => t.symbol === symbol);
    const gross = trades.reduce((s, t) => s + t.grossCents, 0);
    const buyback = trades.reduce((s, t) => s + t.buybackCents, 0);
    const fees = trades.reduce((s, t) => s + t.feesCents, 0);
    const net = (p?.openingNetCents ?? 0) + gross - buyback - fees;
    const shares = p?.shares ?? null;
    const actual = shares > 0 ? (p.nominalCostCents - net) / 100 : null;
    return { symbol, shares, nominalTotal: p ? p.nominalCostCents / 100 : null,
      nominalPerShare: shares > 0 ? p.nominalCostCents / 100 / shares : null,
      grossPremium: gross / 100, buyback: buyback / 100, fees: fees / 100, openingNetPremium: (p?.openingNetCents ?? 0) / 100,
      netPremium: net / 100, actualTotal: actual, actualPerShare: shares > 0 ? actual / shares : null,
      openContracts: trades.filter(t => t.status === 'open').reduce((s, t) => s + t.contracts, 0),
      asOf: p?.asOf ?? null, note: p?.note ?? '', positionKnown: !!p };
  });
  const held = rows.filter(r => r.shares > 0);
  const sum = (rs, key) => Math.round(rs.reduce((s, r) => s + r[key], 0) * 100) / 100;
  return { rows, totals: { holdingSymbols: held.length, nominalTotal: sum(held, 'nominalTotal'),
    actualTotal: sum(held, 'actualTotal'), netPremium: sum(rows, 'netPremium'), grossPremium: sum(rows, 'grossPremium'),
    missingPositions: rows.filter(r => !r.positionKnown).length } };
}

/** Database is private to this plugin. History and current state commit together. */
export class Ledger {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    chmodSync(path, 0o600);
    this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS ledger (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS history (revision INTEGER PRIMARY KEY, date TEXT NOT NULL, action TEXT NOT NULL, before_json TEXT NOT NULL, after_json TEXT NOT NULL);');
    this.db.prepare('INSERT OR IGNORE INTO ledger(id,body) VALUES(1,?)').run(JSON.stringify(empty()));
    if (this.read().version !== 2) throw new LedgerError('账本版本不支持，请保留数据库并升级插件', 409);
  }
  read() { return JSON.parse(this.db.prepare('SELECT body FROM ledger WHERE id=1').get().body); }
  view() {
    const state = this.read();
    return { ...state, ...summarize(state), history: this.db.prepare('SELECT revision,date,action FROM history ORDER BY revision DESC LIMIT 30').all() };
  }
  close() { this.db.close(); }
  /** Apply one optimistic transaction. Stale browser tabs cannot overwrite new records. */
  change(command, signal) {
    signal?.throwIfAborted();
    if (!object(command) || !Number.isInteger(command.revision)) fail('缺少账本版本，请刷新后重试');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const state = this.read();
      if (state.revision !== command.revision) throw new LedgerError('账本已更新，请刷新后重新确认本次操作', 409);
      const before = JSON.stringify(state);
      this.apply(state, command);
      signal?.throwIfAborted();
      if (JSON.stringify(state) !== before) {
        state.revision++;
        const after = JSON.stringify(state);
        this.db.prepare('UPDATE ledger SET body=? WHERE id=1').run(after);
        this.db.prepare('INSERT INTO history VALUES(?,?,?,?,?)').run(state.revision, new Date().toISOString(), command.action, before, after);
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    return this.view();
  }
  apply(state, command) {
    switch (command.action) {
      case 'savePosition': { const p = positionOf(command.data); state.positions[p.symbol] = p; break; }
      case 'saveTrade': {
        const t = tradeOf(command.data), i = state.trades.findIndex(x => x.id === t.id);
        if(i>=0 && state.trades[i].assignment) {
          const old=state.trades[i];
          if(t.symbol!==old.symbol||t.strategy!==old.strategy||t.contracts!==old.contracts||t.status!=='assigned') fail('已处理行权的交易不能修改标的、策略、数量或状态；请撤销行权后重录');
          t.assignment=old.assignment;
        } else if(t.assignment) fail('请通过行权处理生成交割记录');
        if (i >= 0) state.trades[i] = t; else state.trades.push(t);
        break;
      }
      case 'assign': {
        const preview=previewAssignment(state,command.data);
        state.positions[preview.symbol]=preview.position;
        const t=state.trades.find(t=>t.id===preview.tradeId);
        t.status='assigned';t.assignment=preview.record;
        break;
      }
      case 'removeTrade': {
        if (!state.trades.some(t => t.id === command.id)) fail('交易不存在');
        if(state.trades.find(t=>t.id===command.id).assignment) fail('此交易已联动调整持仓，请通过撤销恢复行权记录');
        state.trades = state.trades.filter(t => t.id !== command.id); break;
      }
      case 'propose': {
        const p = command.data;
        if (!object(p) || !['savePosition', 'saveTrade', 'assign'].includes(p.action)) fail('只允许提交持仓或交易草稿');
        if (p.action === 'savePosition') positionOf(p.data); else if(p.action==='assign') previewAssignment(state,p.data); else tradeOf(p.data);
        const id = text(p.requestId, 120);
        if (!id) fail('草稿需要唯一 requestId');
        const existing = state.proposals.find(x => x.id === id);
        if (existing) {
          if (JSON.stringify(existing.command) !== JSON.stringify({ action: p.action, data: p.data })) fail('相同草稿编号对应不同内容');
          return;
        }
        state.proposals.push({ id, status: 'pending', command: { action: p.action, data: p.data }, date: new Date().toISOString(), baseRevision: state.revision });
        break;
      }
      case 'approve': {
        const p = state.proposals.find(x => x.id === command.id && x.status === 'pending');
        if (!p) fail('草稿不存在或已经处理');
        const intervening = this.db.prepare('SELECT action FROM history WHERE revision>?').all(p.baseRevision);
        if (intervening.some(x => !['propose', 'reject'].includes(x.action))) throw new LedgerError('草稿产生后账本已修改，请拒绝旧草稿并重新生成', 409);
        this.apply(state, p.command); p.status = 'approved'; break;
      }
      case 'reject': {
        const p = state.proposals.find(x => x.id === command.id && x.status === 'pending');
        if (!p) fail('草稿不存在或已经处理'); p.status = 'rejected'; break;
      }
      case 'import': this.merge(state, command.data); break;
      case 'undo': {
        const h = this.db.prepare('SELECT before_json FROM history WHERE revision=?').get(state.revision);
        if (!h) fail('暂无可撤销修改');
        const previous = JSON.parse(h.before_json);
        state.positions = previous.positions; state.trades = previous.trades; state.proposals = previous.proposals;
        break;
      }
      default: fail('不支持的操作');
    }
  }
  merge(state, incoming) {
    if (!object(incoming) || !object(incoming.positions) || !Array.isArray(incoming.trades)) fail('请选择账本导出的 JSON 文件');
    if (incoming.version !== undefined && incoming.version !== 2) fail('不支持此账本版本');
    if (incoming.trades.length > 100000 || Object.keys(incoming.positions).length > 10000) fail('导入文件过大');
    const modern = incoming.version === 2;
    for (const [symbol, value] of Object.entries(incoming.positions)) {
      if (!object(value)) fail('持仓格式错误');
      const p = positionOf(modern ? { symbol, shares: value.shares, nominalCost: value.nominalCostCents / 100,
        openingNetPremium: value.openingNetCents / 100, asOf: value.asOf, note: value.note } :
        { symbol, shares: value.shares, nominalCost: value.nominalCost, openingNetPremium: 0,
          asOf: new Date().toISOString().slice(0, 10), note: '从旧账本导入；请核对持仓日期与数量' });
      const old = state.positions[p.symbol];
      // Legacy imports may run on different dates: compare accounting fields only.
      if (old && (old.shares !== p.shares || old.nominalCostCents !== p.nominalCostCents || old.openingNetCents !== p.openingNetCents)) fail(`持仓 ${p.symbol} 与现有账本冲突；未导入，请先核对`);
      if (!old) state.positions[p.symbol] = p;
    }
    for (const source of incoming.trades) {
      const value = modern ? { ...source, openPremium: source.grossCents / 100, buybackCost: source.buybackCents / 100, fees: source.feesCents / 100 } :
        { ...source, status: source.status ?? 'closed', note: `${source.note ?? ''}${source.status ? '' : ' [旧账本未记录状态，请核对]'}`.trim() };
      const fingerprint = createHash('sha256').update(JSON.stringify([value.symbol, value.strategy, value.date, value.openPremium, value.buybackCost, value.fees, value.contracts, value.note])).digest('hex');
      const t = tradeOf({ ...value, id: value.id ?? `import-${fingerprint}` });
      if (!modern && source.realizedPnl !== undefined && cents(source.realizedPnl, '旧账本净收益', true) !== t.grossCents - t.buybackCents - t.feesCents) fail('旧账本净收益与现金流不一致，未导入');
      const old = state.trades.find(x => x.id === t.id);
      if (old && JSON.stringify(old) !== JSON.stringify(t)) fail(`交易 ${t.id} 与现有记录冲突，未导入`);
      if (!old) state.trades.push(t);
    }
  }
}
