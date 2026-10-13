import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Ledger, previewAssignment } from '../ledger.js';
import { apply, ledgerTools } from '../integration.js';
import { apply as applyAgent } from '../agent.js';

const position = (symbol='TEST', extra={}) => ({symbol,shares:100,nominalCost:10000,openingNetPremium:0,asOf:'2026-10-12',note:'synthetic test',...extra});
const trade = (symbol='TEST', extra={}) => ({id:'trade-1',symbol,strategy:'CC',status:'closed',contracts:1,openPremium:1200,buybackCost:190,fees:10,date:'2026-10-12',note:'synthetic test',...extra});
function fixture(t) { const path=join(mkdtempSync(join(tmpdir(),'options-ledger-test-')),'ledger.sqlite');const ledger=new Ledger(path);t.after(()=>ledger.close());return {ledger,path,change:(action,data)=>ledger.change({action,data,revision:ledger.read().revision})}; }

test('confirmed premiums, buybacks and fees yield $90/share; symbols remain isolated',t=>{
  const {ledger,change}=fixture(t);
  change('savePosition',position());change('savePosition',position('OTHER',{nominalCost:20000}));
  change('saveTrade',trade());
  const v=ledger.view();const a=v.rows.find(x=>x.symbol==='TEST'),b=v.rows.find(x=>x.symbol==='OTHER');
  assert.equal(a.grossPremium,1200);assert.equal(a.netPremium,1000);assert.equal(a.actualPerShare,90);assert.equal(a.actualTotal,9000);
  assert.equal(b.actualPerShare,200);assert.equal(b.netPremium,0);assert.equal(v.totals.actualTotal,29000);
});
test('zero holdings retain premium history without pretending to have a cost basis',t=>{
  const {ledger,change}=fixture(t);change('savePosition',position('TEST',{shares:0,nominalCost:0}));change('saveTrade',trade());
  assert.equal(ledger.view().rows[0].actualPerShare,null);assert.equal(ledger.view().totals.actualTotal,0);assert.equal(ledger.view().totals.netPremium,1000);
});
test('missing positions are visibly unknown; opening net adjustments and negative basis remain explicit',t=>{
  const {ledger,change}=fixture(t);change('saveTrade',trade());assert.equal(ledger.view().rows[0].shares,null);assert.equal(ledger.view().totals.missingPositions,1);
  change('savePosition',position('TEST',{nominalCost:100,openingNetPremium:-100}));assert.equal(ledger.view().rows[0].netPremium,900);assert.equal(ledger.view().rows[0].actualPerShare,-8);
});
test('stale concurrent editors cannot overwrite; identical trade ids do not accumulate twice',t=>{
  const {ledger,change}=fixture(t);change('saveTrade',trade());change('saveTrade',trade());assert.equal(ledger.read().trades.length,1);assert.equal(ledger.read().revision,1);
  assert.throws(()=>ledger.change({action:'savePosition',revision:0,data:position()}),/已更新/);assert.equal(Object.keys(ledger.read().positions).length,0);
});
test('validated entry rejects blanks, nonfinite values, fractions of cents, invalid dates and open buybacks',t=>{
  const {ledger,change}=fixture(t);
  for(const v of ['',null,true,NaN,Infinity,-1])assert.throws(()=>change('savePosition',position('TEST',{shares:v})));
  assert.throws(()=>change('saveTrade',trade('TEST',{fees:0.001})));
  assert.throws(()=>change('saveTrade',trade('TEST',{date:'2026-02-30'})));
  assert.throws(()=>change('saveTrade',trade('TEST',{status:'open'})));
  assert.throws(()=>change('savePosition',position('__proto__')));
  assert.equal(ledger.read().revision,0);
});
test('legacy import is atomic, deduplicated and rejects inconsistent P/L or position conflicts',t=>{
  const {ledger,change}=fixture(t);
  const legacy={positions:{TEST:{shares:100,nominalCost:10000}},trades:[{...trade(),realizedPnl:1000}]};
  change('import',legacy);const first=ledger.read();change('import',legacy);assert.deepEqual(ledger.read(),first);
  assert.throws(()=>change('import',{positions:{NEW:{shares:20,nominalCost:100}},trades:[{...trade(),id:'bad',realizedPnl:999}]}),/不一致/);
  assert.deepEqual(ledger.read(),first);
  assert.throws(()=>change('import',{positions:{TEST:{shares:200,nominalCost:10000}},trades:[]}),/冲突/);
});
test('export/import round trip preserves accounting state',t=>{
  const {ledger,change}=fixture(t),other=fixture(t);change('savePosition',position());change('saveTrade',trade());
  other.change('import',ledger.read());assert.deepEqual(other.ledger.view().rows,ledger.view().rows);
});
test('database survives close/reopen; two connections see the same committed state',t=>{
  const {ledger,path,change}=fixture(t);change('savePosition',position());
  const second=new Ledger(path);assert.equal(second.view().rows[0].shares,100);
  second.change({action:'saveTrade',revision:1,data:trade()});second.close();assert.equal(ledger.view().rows[0].actualPerShare,90);
});
test('removal and undo are audited and recoverable',t=>{
  const {ledger,change}=fixture(t);change('saveTrade',trade());ledger.change({action:'removeTrade',revision:1,id:'trade-1'});assert.equal(ledger.read().trades.length,0);
  change('undo');assert.equal(ledger.read().trades.length,1);assert.equal(ledger.view().history.length,3);
});
test('model tool read and proposal share storage; proposal requires review and is idempotent',async t=>{
  const {ledger}=fixture(t),[read,propose]=ledgerTools(ledger),exec={signal:new AbortController().signal};
  const args={revision:0,request_id:'fixture-1',action:'savePosition',data_json:JSON.stringify(position())};
  await propose.execute(args,exec);assert.equal((await read.execute({},exec)).rows.length,0);
  await propose.execute({...args,revision:1},exec);assert.equal(ledger.read().proposals.length,1);
  ledger.change({action:'approve',revision:1,id:'fixture-1'});assert.equal((await read.execute({},exec)).rows[0].shares,100);
  assert.throws(()=>ledger.change({action:'approve',revision:2,id:'fixture-1'}),/已经处理/);
});
test('review refuses a draft if the ledger changed since it was proposed',t=>{
  const {ledger,change}=fixture(t);change('propose',{requestId:'draft',action:'savePosition',data:position()});change('savePosition',position('OTHER'));
  assert.throws(()=>ledger.change({action:'approve',revision:2,id:'draft'}),/账本已修改/);
  assert.equal(ledger.read().positions.TEST,undefined);
});
test('cancelled commands never write',async t=>{
  const {ledger}=fixture(t),controller=new AbortController();controller.abort();
  assert.throws(()=>ledger.change({action:'savePosition',revision:0,data:position()},controller.signal));
  await assert.rejects(ledgerTools(ledger)[0].execute({}, {signal:controller.signal}));assert.equal(ledger.read().revision,0);
});
test('premiums survive selling all stock and apply only to the same symbol in the next cycle',t=>{
  const {ledger,change}=fixture(t);
  change('savePosition',position());change('saveTrade',trade());
  change('savePosition',position('TEST',{shares:0,nominalCost:0}));
  change('savePosition',position('TEST',{shares:200,nominalCost:18000}));
  assert.equal(ledger.view().rows[0].actualPerShare,85);
  assert.equal(ledger.view().rows[0].netPremium,1000);
});
test('open CSP and CC cashflows count once; a loss-making buyback increases actual cost',t=>{
  const {ledger,change}=fixture(t);change('savePosition',position());
  change('saveTrade',trade('TEST',{id:'put',strategy:'CSP',status:'open',openPremium:200,buybackCost:0,fees:2}));
  change('saveTrade',trade('TEST',{id:'call',status:'closed',openPremium:100,buybackCost:400,fees:3}));
  assert.equal(ledger.view().rows[0].grossPremium,300);
  assert.equal(ledger.view().rows[0].netPremium,-105);
  assert.equal(ledger.view().rows[0].actualPerShare,101.05);
  change('saveTrade',trade('TEST',{id:'put',strategy:'CSP',status:'expired',openPremium:200,buybackCost:0,fees:2}));
  assert.equal(ledger.view().rows[0].netPremium,-105);
});
test('partial holdings changes retain all symbol premiums after an explicitly confirmed nominal cost',t=>{
  const {ledger,change}=fixture(t);change('savePosition',position('TEST',{shares:200,nominalCost:11000}));
  change('saveTrade',trade('TEST',{openPremium:500,buybackCost:0,fees:0}));
  change('savePosition',position('TEST',{shares:100,nominalCost:5600}));
  assert.equal(ledger.view().rows[0].netPremium,500);
  assert.equal(ledger.view().rows[0].actualPerShare,51);
});
test('confirmed partial CC assignment transfers $100 loss: 200 at $55 -> 100 at $56 nominal',t=>{
  const {ledger,change}=fixture(t);change('savePosition',position('TEST',{shares:200,nominalCost:11000}));
  change('saveTrade',trade('TEST',{status:'open',openPremium:500,buybackCost:0,fees:0}));
  const input={tradeId:'trade-1',strike:54,multiplier:100,stockFees:0,assignedNominalCost:5500,asOf:'2026-10-13'};
  assert.equal(previewAssignment(ledger.read(),input).record.afterNominalCents,560000);
  change('assign',input);const r=ledger.view().rows[0];
  assert.equal(r.shares,100);assert.equal(r.nominalTotal,5600);assert.equal(r.netPremium,500);assert.equal(r.actualPerShare,51);
  const assigned=ledger.read();assert.throws(()=>change('assign',input),/只能处理/);assert.deepEqual(ledger.read(),assigned);
  assert.throws(()=>ledger.change({action:'removeTrade',revision:assigned.revision,id:'trade-1'}),/行权/);
  change('undo');assert.equal(ledger.view().rows[0].shares,200);assert.equal(ledger.read().trades[0].status,'open');
});
test('CSP assignment adds stock and delivery fees, preserving received premiums',t=>{
  const {ledger,change}=fixture(t);change('saveTrade',trade('TEST',{strategy:'CSP',status:'open',openPremium:500,buybackCost:0,fees:2}));
  change('assign',{tradeId:'trade-1',strike:55,multiplier:100,stockFees:1,asOf:'2026-10-13'});
  const row=ledger.view().rows[0];assert.equal(row.shares,100);assert.equal(row.nominalTotal,5501);assert.equal(row.netPremium,498);assert.equal(row.actualPerShare,50.03);
});
test('assignment refuses insufficient stock, unknown batch cost, and invalid multiplier without partial writes',t=>{
  const {ledger,change}=fixture(t);change('savePosition',position('TEST',{shares:50,nominalCost:2750}));change('saveTrade',trade('TEST',{status:'open',buybackCost:0}));
  const before=ledger.read();const input={tradeId:'trade-1',strike:54,multiplier:100,stockFees:0,assignedNominalCost:5500,asOf:'2026-10-13'};
  assert.throws(()=>change('assign',input),/不足/);assert.deepEqual(ledger.read(),before);
  assert.throws(()=>change('assign',{...input,multiplier:0}),/乘数/);
  change('savePosition',position('TEST',{shares:200,nominalCost:11000}));assert.throws(()=>change('assign',{...input,assignedNominalCost:''}),/不能为空/);
});
test('fully called-away stock has zero remaining cost but keeps historical option cashflow',t=>{
  const {ledger,change}=fixture(t);change('savePosition',position('TEST',{shares:100,nominalCost:5500}));change('saveTrade',trade('TEST',{status:'open',buybackCost:0}));
  change('assign',{tradeId:'trade-1',strike:54,multiplier:100,stockFees:0,assignedNominalCost:5500,asOf:'2026-10-13'});
  const r=ledger.view().rows[0];assert.equal(r.shares,0);assert.equal(r.nominalTotal,0);assert.equal(r.actualPerShare,null);assert.equal(r.netPremium,1190);
});
test('assignment export/import round trip preserves stocks and does not apply delivery twice',t=>{
  const {ledger,change}=fixture(t),other=fixture(t);change('saveTrade',trade('TEST',{strategy:'CSP',status:'open',buybackCost:0}));
  change('assign',{tradeId:'trade-1',strike:55,multiplier:100,stockFees:0,asOf:'2026-10-13'});
  other.change('import',ledger.read());other.change('import',ledger.read());assert.deepEqual(other.ledger.view().rows,ledger.view().rows);
  assert.deepEqual(other.ledger.read().trades[0].assignment,ledger.read().trades[0].assignment);
});
test('assignment drafts change no holdings until user confirms',t=>{
  const {ledger,change}=fixture(t);change('saveTrade',trade('TEST',{strategy:'CSP',status:'open',buybackCost:0}));
  change('propose',{requestId:'assignment-draft',action:'assign',data:{tradeId:'trade-1',strike:55,multiplier:100,stockFees:0,asOf:'2026-10-13'}});
  assert.equal(ledger.view().rows[0].shares,null);
  ledger.change({action:'approve',revision:ledger.read().revision,id:'assignment-draft'});assert.equal(ledger.view().rows[0].shares,100);
});
test('host route and preset-scoped tools use the exact same ledger',async t=>{
  const home=mkdtempSync(join(tmpdir(),'ledger-host-test-')),effects=[];let route;
  const shared={dshHomePath:(...parts)=>join(home,...parts),effect:fn=>effects.push(fn())};
  apply({...shared,connection:{fetch:{register:r=>{route=r}}}});
  t.after(()=>effects.reverse().forEach(fn=>fn()));
  const tools=[],sections=[];
  const register=x=>{tools.push(x);return ()=>{tools.splice(tools.indexOf(x),1)}};
  applyAgent({...shared,tools:{register},systemPrompt:{section:x=>{sections.push(x);return ()=>sections.splice(sections.indexOf(x),1)}}});assert.equal(tools.length,2);assert.equal(sections.length,1);
  const res=await route.fetch(new Request('http://local/api/options-ledger',{method:'POST',body:JSON.stringify({action:'savePosition',revision:0,data:position()})}));assert.equal(res.status,200);
  assert.equal((await tools[0].execute({}, {signal:new AbortController().signal})).rows[0].shares,100);
  const bad=await route.fetch(new Request('http://local/api/options-ledger',{method:'POST',body:'{broken'}));assert.equal(bad.status,400);
});
