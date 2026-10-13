/** Harness Host integration: authenticated ledger endpoint and scoped model tools. */
import { Ledger, LedgerError, previewAssignment } from './ledger.js';

export const name = 'options-ledger';
export const inject = ['connection', 'dshHomePath'];
const API = '/api/options-ledger';
const jsonSchema = { type: 'object', properties: {}, additionalProperties: true };
const output = { schema: jsonSchema, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] };

/** Make tool definitions for a shared ledger; mutations are only pending drafts. */
export function ledgerTools(ledger) {
  return [
    { name: 'options_ledger_read', description: '读取期权账本的真实持仓、累计权利金、净权利金、名义成本与实际成本。数据缺失时不能推测；所有金额为美元。',
      parameters: { type: 'object', properties: {}, additionalProperties: false }, output,
      execute: async (args, exec) => {
        exec.signal.throwIfAborted();
        if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).length) throw new LedgerError('读取工具不接受参数');
        return ledger.view();
      },
      presentCall: () => ({ card: 'generic', title: '读取期权账本', kind: 'read' }) },
    { name: 'options_ledger_propose', description: '提交期权账本修改草稿，用户在左侧期权账本确认后才入账。先读取账本。action=savePosition 时 data_json 包含 symbol,shares,nominalCost(总成本美元),openingNetPremium(未逐笔录入的期初累计净权利金),asOf(YYYY-MM-DD),note；action=saveTrade 时包含 symbol,strategy(CSP/CC),status(open/closed/expired/assigned),contracts,openPremium(整笔美元),buybackCost,fees,date,note，修改旧交易还须提供原 id。action=assign 时 data_json 包含 tradeId,strike(每股美元),multiplier(每张股数),stockFees(股票交割手续费),assignedNominalCost(CC交割股票原名义总成本，需核对批次),asOf。只有实际行权才能提交，整笔交易交割；未发生的订单不可入账。CC亏损转给剩余股票，盈利不转入。相同请求重试必须复用 request_id。',
      parameters: { type: 'object', properties: { revision: { type: 'integer' }, request_id: { type: 'string' }, action: { type: 'string', enum: ['savePosition', 'saveTrade', 'assign'] }, data_json: { type: 'string' } }, required: ['revision', 'request_id', 'action', 'data_json'], additionalProperties: false }, output,
      execute: async (args, exec) => {
        exec.signal.throwIfAborted();
        if (!args || typeof args !== 'object' || typeof args.data_json !== 'string' || args.data_json.length > 20000) throw new LedgerError('无效草稿');
        const data = JSON.parse(args.data_json);
        const result = ledger.change({ action: 'propose', revision: args.revision, data: { requestId: args.request_id, action: args.action, data } }, exec.signal);
        return { revision: result.revision, status: 'pending-user-review', message: '草稿已提交，请在左侧“期权账本”的待确认区域查看并确认。持仓与交易尚未修改。', proposals: result.proposals.filter(x => x.status === 'pending') };
      },
      presentCall: () => ({ card: 'generic', title: '提交期权账本草稿', kind: 'edit' }) },
  ];
}

/** Mount beside the Web bundle. Credentials and Host/Origin checks remain owned by Connection. */
export function apply(ctx) {
  const ledger = new Ledger(ctx.dshHomePath('data', 'options-ledger', 'ledger.sqlite'));
  let closing = false;
  ctx.effect(() => () => ledger.close(), 'options-ledger: close storage');
  ctx.connection.fetch.register({ path: API, methods: ['GET', 'POST'], requestBody: 'buffered',
    fetch: async request => {
      try {
        if (closing) throw new LedgerError('账本正在重载，请稍后重试', 503);
        let result;
        if (request.method === 'GET') result = ledger.view();
        else {
          const body = await request.text();
          if (closing) throw new LedgerError('账本正在重载，请稍后重试', 503);
          if (body.length > 8 * 1024 * 1024) throw new LedgerError('导入文件不能超过 8 MB', 413);
          const command=JSON.parse(body);
          if(command.action==='previewAssignment') {
            const state=ledger.read();
            if(command.revision!==state.revision) throw new LedgerError('账本已更新，请重新打开行权表单',409);
            result=previewAssignment(state,command.data);
          } else result = ledger.change(command, request.signal);
        }
        return Response.json(result, { headers: { 'cache-control': 'no-store' } });
      } catch (error) {
        return Response.json({ error: error instanceof LedgerError || error instanceof SyntaxError ? error.message : '账本存储失败，原数据未更改。请检查磁盘和服务日志。' }, { status: error.status ?? (error instanceof SyntaxError ? 400 : 500), headers: { 'cache-control': 'no-store' } });
      }
    },
  });
  ctx.effect(() => () => { closing = true; }, 'options-ledger: stop new operations');
}
