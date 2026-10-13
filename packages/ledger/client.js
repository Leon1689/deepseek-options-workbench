/* Native Harness client plugin. React comes from the host's shared module table. */
window.__ModuleLoader__.load({ id: '@local/options-ledger-dashboard', factory: require => {
  const React = require('react');
  const { createElement: h, useState, useEffect } = React;
  const NS = 'localOptionsLedger';
  const COPY = {
    openFull: '打开完整账本', compactEmpty: '尚未录入真实持仓。点击打开完整账本，录入或导入你的数据。', compactTotal: '剩余股数（按标的查看）', assignment: '记录实际行权', assignmentHelp: '仅记录已经发生的交割，不发送订单。此操作处理整笔期权交易；部分合约行权请先拆分交易。交割成本默认按平均成本预填，多批次请核对后修改。CC 亏损转给剩余股票，盈利不转入；历史净权利金继续全部保留。', strike: '行权执行价（每股）', multiplier: '每张合约股数', stockFees: '股票交割手续费（勿重复填期权手续费）', assignedCost: '交割股票原名义总成本（核对批次）', assignmentDate: '交割日期', preview: '计算行权后成本', confirmAssignment: '确认行权并更新持仓', afterShares: '行权后剩余股数', afterNominal: '行权后名义总成本', transferredLoss: '转给剩余股票的名义亏损', actionAssign: '行权交割', title: '期权账本', subtitle: '你的持仓、期权现金流与实际成本，在同一处核对。',
    tag: '美股期权模式 · USD', refresh: '刷新', export: '导出备份', import: '导入账本', position: '录入 / 调整持仓', trade: '记录期权交易',
    holdings: '持仓标的', nominalTotal: '持仓名义总成本', netTotal: '累计净权利金', actualTotal: '剩余持仓实际总成本',
    overview: '全部标的', symbol: '标的', shares: '剩余股数', nominal: '名义总成本', nominalPer: '每股名义成本', gross: '已录入卖出权利金',
    net: '累计净权利金', actualPer: '每股实际成本', actual: '实际总成本', open: '未平仓合约', date: '持仓核对日期', actions: '操作',
    edit: '调整', empty: '还没有账本数据', emptyText: '先录入当前持仓，再记录期权交易；也可以导入之前导出的 JSON 账本。',
    demo: '查看模拟示例', demoBanner: '模拟示例 · TEST 为虚拟标的，以下数据不会写入你的账本。', exitDemo: '返回我的账本',
    explanation: '实际成本按标的独立计算：（剩余名义总成本 − 该标的累计净权利金）÷ 剩余股数。累计净权利金包含期初调整与已确认成交现金流，扣除买回支出及手续费；含未平仓期权已收到的权利金。此处为你的策略成本口径。',
    missing: '部分标的未录入持仓，成本汇总仅包含持仓已核对且股数大于 0 的标的。',
    noPosition: '待录入', noShares: '无持仓', details: '交易明细', noTrades: '尚无期权交易记录', allSymbols: '全部标的',
    strategy: '策略', status: '状态', contracts: '合约数', grossInput: '卖出权利金（整笔美元）', buyback: '买回支出', fees: '手续费', tradeDate: '成交日期', note: '备注',
    opened: '未平仓', closed: '已平仓', expired: '已到期', assigned: '已行权', netFlow: '净现金流',
    save: '保存并更新账本', cancel: '取消', saving: '正在保存…', saved: '已保存到本机账本', loading: '正在读取账本…',
    opening: '期初累计净权利金', openingHelp: '仅填写没有逐笔录入的历史净权利金。之后导入这些历史交易时，应先调整此值，避免重复累计。可为负数。',
    positionHelp: '这里填写的是当前剩余股票的总成本，不是每股价格。行权后请核对剩余股数与总成本，再保存。',
    tradeHelp: '所有金额按整笔交易填写，无需再乘 100。单独修改状态不会改变持仓；实际交割请保存为未平仓后点击“记录实际行权”，预览并确认股数与成本。历史已行权记录须与手动录入的持仓核对。',
    delete: '移除此交易', deleteConfirm: '移除这笔交易后将重新计算成本。可以通过“撤销上次修改”恢复。是否继续？',
    undo: '撤销上次修改', undoConfirm: '恢复到最近一次修改前的账本？此操作会保留修改历史。',
    importHelp: '支持旧版 option-ledger.json 和此插件导出的 JSON。按交易编号去重合并；同编号或同标的持仓冲突时整次拒绝，不覆盖。',
    file: '选择 JSON 文件', importReady: '文件已读取，请核对后确认导入。', confirmImport: '确认导入',
    drafts: '聊天提交的待确认修改', approve: '确认入账', reject: '拒绝草稿', draftHelp: '模型提交的内容尚未改变持仓。请核对下方字段，确认后入账。',
    history: '最近修改', local: '账本保存在本机，刷新或切换模型后仍可读取。没有连接券商或实时行情。',
    lastUpdated: '最后读取', filter: '筛选标的', revision: '账本版本', toolsHint: '在美股期权模式中，可让模型调用 options_ledger_read 查询账本，或提交修改草稿供你确认。',
    error: '读取或保存失败', noFile: '请先选择 JSON 文件', fileLarge: '文件不能超过 8 MB', invalidFile: '文件必须包含 positions 对象和 trades 数组',
    pendingName: '草稿编号', actionSavePosition: '更新持仓', actionSaveTrade: '记录 / 更新交易', actionImport: '导入账本', actionUndo: '撤销', actionRemoveTrade: '移除交易', actionPropose: '新增草稿', actionApprove: '确认草稿', actionReject: '拒绝草稿',
  };
  const styles = `
  .ol-mode-summary{border:1px solid var(--dsw-border,#dde3ed);border-radius:12px;padding:16px;margin:8px 0 12px;font-size:12px;background:var(--dsw-bg,#f7f9fd);color:var(--dsw-text,#182230)}.ol-mode-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.ol-mode-summary p{margin:12px 0;line-height:1.5}.ol-mode-totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.ol-mode-totals span,.ol-mode-totals strong{display:block}.ol-mode-totals strong{margin-top:6px;font-size:16px}.ol-mode-table{max-height:210px;overflow:auto;margin:12px 0}.ol-mode-table table{width:100%;border-collapse:collapse;white-space:nowrap}.ol-mode-table td,.ol-mode-table th{padding:7px 9px;text-align:right;border-bottom:1px solid #dde3ed}.ol-mode-table td:first-child,.ol-mode-table th:first-child{text-align:left}.ol-mode-summary small{display:block;line-height:1.5;opacity:.75}
  .ol-page{--ol-bg:#f5f7fb;--ol-card:#fff;--ol-text:#182230;--ol-muted:#667085;--ol-border:#e2e7ef;--ol-accent:#245bcc;--ol-soft:#edf3ff;box-sizing:border-box;height:100%;overflow:auto;padding:32px;color:var(--ol-text);background:var(--ol-bg);font-family:inherit}
  .ol-page *{box-sizing:border-box}.ol-wrap{max-width:1440px;margin:auto}.ol-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:26px}.ol-tag{font-size:12px;font-weight:650;letter-spacing:.06em;color:var(--ol-accent)}.ol-page h1{font-size:30px;margin:6px 0 8px;letter-spacing:-.03em}.ol-page h2{font-size:18px;margin:0}.ol-sub,.ol-help{color:var(--ol-muted);font-size:13px;line-height:1.65}.ol-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.ol-btn{font:inherit;font-size:13px;border:1px solid var(--ol-border);background:var(--ol-card);color:var(--ol-text);border-radius:8px;padding:9px 13px;cursor:pointer}.ol-btn:hover{border-color:var(--ol-accent);color:var(--ol-accent)}.ol-btn:disabled{opacity:.45;cursor:default}.ol-primary{background:var(--ol-accent);color:white;border-color:var(--ol-accent)}.ol-primary:hover{color:white;filter:brightness(1.08)}.ol-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.ol-card,.ol-panel{background:var(--ol-card);border:1px solid var(--ol-border);border-radius:12px}.ol-card{padding:20px}.ol-card strong{display:block;font-size:25px;letter-spacing:-.02em;margin-top:10px;font-variant-numeric:tabular-nums}.ol-card:last-child{background:var(--ol-soft);border-color:#b3c9fa}.ol-panel{padding:22px;margin:18px 0}.ol-panelhead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:18px}.ol-scroll{overflow:auto}.ol-page table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:13px}.ol-page th{text-align:right;color:var(--ol-muted);font-weight:500;font-size:12px;padding:12px;border-bottom:1px solid var(--ol-border)}.ol-page td{text-align:right;padding:15px 12px;border-bottom:1px solid var(--ol-border);font-variant-numeric:tabular-nums}.ol-page th:first-child,.ol-page td:first-child{text-align:left}.ol-page tbody tr:last-child td{border-bottom:0}.ol-symbol{font-weight:750}.ol-green{color:#087443}.ol-negative{color:#bd3e32}.ol-cost{font-weight:700;color:var(--ol-accent)}.ol-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:20px 0}.ol-field{display:flex;flex-direction:column;gap:7px;font-size:13px}.ol-input{font:inherit;border:1px solid var(--ol-border);border-radius:7px;background:var(--ol-card);color:var(--ol-text);padding:10px;width:100%;min-width:0}.ol-wide{grid-column:1/-1}.ol-info{background:var(--ol-soft);color:var(--ol-accent);padding:12px 15px;border-radius:8px;font-size:13px;line-height:1.7;margin:15px 0}.ol-error{background:#fff0ed;color:#a32a1d}.ol-success{background:#e8f6ef;color:#086541}.ol-empty{text-align:center;padding:44px 15px}.ol-empty h2{font-size:20px;margin:12px}.ol-draft{padding:16px;border:1px solid var(--ol-border);border-radius:9px;margin:12px 0}.ol-draft dl{display:grid;grid-template-columns:180px 1fr;font-size:13px;gap:7px}.ol-draft dt{color:var(--ol-muted)}.ol-draft dd{margin:0;overflow-wrap:anywhere}.ol-foot{font-size:12px;color:var(--ol-muted);padding:6px 0 24px;line-height:1.8}.ol-pill{display:inline-block;padding:4px 8px;border-radius:5px;background:var(--ol-soft);font-size:12px}.ol-details{margin-top:18px}.ol-details summary{cursor:pointer;color:var(--ol-muted);font-size:13px}.ol-history{font-size:12px;color:var(--ol-muted);line-height:2}.ol-bar{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}.ol-filter{max-width:200px}
  @media(max-width:1100px){.ol-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ol-head{display:block}.ol-head>.ol-actions{margin-top:16px}.ol-page{padding:22px}.ol-form{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.ol-page{padding:14px}.ol-form{grid-template-columns:1fr}.ol-card{padding:14px}.ol-card strong{font-size:20px}.ol-panel{padding:14px}.ol-draft dl{grid-template-columns:1fr}}
  @media(prefers-color-scheme:dark){.ol-page{--ol-bg:#141922;--ol-card:#1c2430;--ol-text:#edf1f7;--ol-muted:#adb9ca;--ol-border:#354154;--ol-accent:#8caeff;--ol-soft:#22314e}.ol-primary{color:#111b2c}.ol-green{color:#77d7a7}.ol-negative{color:#ff9b8e}}
  `;
  const cash = n => n === null || n === undefined ? '—' : new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(n);
  const today = () => new Date().toLocaleDateString('en-CA');
  const freshPosition = () => ({symbol:'',shares:'',nominalCost:'',openingNetPremium:'0',asOf:today(),note:''});
  const freshTrade = () => ({id:crypto.randomUUID(),symbol:'',strategy:'CSP',status:'open',contracts:'1',openPremium:'',buybackCost:'0',fees:'0',date:today(),note:''});
  const DEMO = { revision:0, positions:{}, trades:[], proposals:[], history:[], totals:{holdingSymbols:1,nominalTotal:10000,netPremium:1000,actualTotal:9000,missingPositions:0},
    rows:[{symbol:'TEST',shares:100,nominalTotal:10000,nominalPerShare:100,grossPremium:1200,buyback:190,fees:10,openingNetPremium:0,netPremium:1000,actualTotal:9000,actualPerShare:90,openContracts:0,asOf:'2026-10-12',positionKnown:true,note:''}] };

  function Icon({ size = 20 }) { return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,'aria-hidden':true},h('rect',{x:4,y:3,width:16,height:18,rx:3}),h('path',{d:'M8 8h8M8 12h3M8 16h3m3-2 2 2 3-4'})); }

  function ModeLedger(props) {
    const preset = props.useSessions(state => state.byId[props.sessionId]?.projectionValues?.agentPreset);
    return preset === 'options-trading' ? h(ModeLedgerSummary, props) : null;
  }
  function ModeLedgerSummary({ t, load, openLedger }) {
    const [data,setData] = useState(null), [error,setError] = useState('');
    useEffect(() => {
      const controller = new AbortController(); let timer;
      const read = async () => { try { const next = await load(controller.signal); if (!controller.signal.aborted) {setData(next);setError('');} }
        catch(e) {if (!controller.signal.aborted) setError(e.message);}
        finally {if (!controller.signal.aborted) timer=setTimeout(read,5000);} };
      read();return () => {controller.abort();clearTimeout(timer);};
    },[load]);
    const table = data && h('div', { className:'ol-mode-table' },
      h('table', null,
        h('thead', null, h('tr', null, ['symbol','shares','nominal','nominalPer','net','actual','actualPer'].map(k=>h('th',{key:k,scope:'col'},t(k))))),
        h('tbody', null, data.rows.map(r=>h('tr',{key:r.symbol},
          h('th',{scope:'row'},r.symbol),
          h('td',null,r.shares===null?t('noPosition'):r.shares.toLocaleString()),
          h('td',null,cash(r.nominalTotal)),h('td',null,cash(r.nominalPerShare)),h('td',null,cash(r.netPremium)),h('td',null,cash(r.actualTotal)),h('td',null,cash(r.actualPerShare))
        )))
      )
    );
    const totals = data && h('div',{className:'ol-mode-totals'},
      [['nominalTotal',data.totals.nominalTotal],['netTotal',data.totals.netPremium],['actualTotal',data.totals.actualTotal]].map(([key,value])=>
        h('div',{key},h('span',null,t(key)),h('strong',null,cash(value)))));
    return h('section',{className:'ol-mode-summary','aria-label':t('title')},
      h('div',{className:'ol-mode-heading'},h('strong',null,t('title')),h('button',{className:'ol-btn',type:'button',onClick:openLedger},t('openFull'))),
      error && h('p',{role:'alert'},error),
      !data ? h('p',null,t('loading')) : data.rows.length === 0 ? h('p',null,t('compactEmpty')) : h(React.Fragment,null,
        totals, data.totals.missingPositions > 0 && h('p',null,t('missing')), table),
      h('small',null,t('local')));
  }

  function Dashboard({ t, load, mutate }) {
    const [data,setData]=useState(null), [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
    const [form,setFormState]=useState(null),[formRevision,setFormRevision]=useState(null);
    const setForm = value => { setFormState(value); setFormRevision(value ? data?.revision : null); };
    const [p,setP]=useState(freshPosition),[tr,setTr]=useState(freshTrade),[incoming,setIncoming]=useState(null);
    const [assignment,setAssignment]=useState(null),[assignmentPreview,setAssignmentPreview]=useState(null),[demo,setDemo]=useState(false),[filter,setFilter]=useState(''),[seen,setSeen]=useState('');
    const accept = next => { setData(old => !old || next.revision >= old.revision ? next : old); setSeen(new Date().toLocaleTimeString()); };
    useEffect(() => {
      const controller=new AbortController(); let timer;
      const refresh=async()=>{ try { const next=await load(controller.signal); if(!controller.signal.aborted){accept(next);setError('');} }catch(e){if(!controller.signal.aborted)setError(e.message)} finally {if(!controller.signal.aborted)timer=setTimeout(refresh,5000);} };
      refresh(); return()=>{controller.abort();clearTimeout(timer)};
    },[load]);
    const refresh=async()=>{try{accept(await load());setError('')}catch(e){setError(e.message)}};
    const action=async(command)=>{
      if(busy||!data||demo)return;
      setBusy(true);setNotice('');setError('');
      try{const next=await mutate({...command,revision:['savePosition','saveTrade','import','assign'].includes(command.action)?formRevision:data.revision});accept(next);setForm(null);setIncoming(null);setNotice(t('saved'));}
      catch(e){setError(e.message);await refresh();setError(e.message)}finally{setBusy(false)}
    };
    const view=demo?DEMO:data;
    const btn=(label,onClick,primary=false,disabled=false)=>h('button',{type:'button',className:'ol-btn'+(primary?' ol-primary':''),onClick,disabled:busy||disabled},label);
    const field=(label,key,values,setValues,type='text',options=null)=>h('label',{className:'ol-field',key},t(label), options?
      h('select',{className:'ol-input',disabled:busy,value:values[key],onChange:e=>setValues({...values,[key]:e.target.value})},options.map(([v,l])=>h('option',{key:v,value:v},l))):
      h('input',{className:'ol-input',disabled:busy,type,value:values[key]??'',required:key!=='note',step:type==='number'?(key==='shares'?'0.000001':key==='contracts'?'1':'0.01'):undefined,onChange:e=>setValues({...values,[key]:e.target.value})}));
    const statusLabel=s=>t({open:'opened',closed:'closed',expired:'expired',assigned:'assigned'}[s]||'closed');
    const exportData=()=>{
      const {version,revision,positions,trades}=data;
      const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({version,revision,positions,trades},null,2)],{type:'application/json'}));
      a.href=url;a.download=`options-ledger-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    const editPosition=r=>{setP({symbol:r.symbol,shares:r.shares??'',nominalCost:r.nominalTotal??'',openingNetPremium:r.openingNetPremium??0,asOf:r.asOf??today(),note:r.note??''});setForm('position');setNotice('');};
    const editTrade=r=>{setTr({...r,openPremium:r.grossCents/100,buybackCost:r.buybackCents/100,fees:r.feesCents/100});setForm('trade');setNotice('');};
    const openAssignment=r=>{
      const position=data.positions[r.symbol];
      setAssignment({tradeId:r.id,symbol:r.symbol,strategy:r.strategy,strike:'',multiplier:'100',stockFees:'0',assignedNominalCost:position?.shares?Number((position.nominalCostCents/100/position.shares*r.contracts*100).toFixed(2)):'',asOf:today()});
      setAssignmentPreview(null);setForm('assignment');setNotice('');
    };
    const updateAssignment=value=>{setAssignment(value);setAssignmentPreview(null);};
    const previewAssignment=async()=>{
      setBusy(true);setError('');
      try {setAssignmentPreview(await mutate({action:'previewAssignment',revision:formRevision,data:assignment}));}
      catch(e){setError(e.message);}finally{setBusy(false);}
    };
    const historyLabel=action=>t({savePosition:'actionSavePosition',saveTrade:'actionSaveTrade',import:'actionImport',undo:'actionUndo',removeTrade:'actionRemoveTrade',propose:'actionPropose',assign:'actionAssign',approve:'actionApprove',reject:'actionReject'}[action]||'history');
    const fieldLabels={tradeId:'details',strike:'strike',multiplier:'multiplier',stockFees:'stockFees',assignedNominalCost:'assignedCost',symbol:'symbol',shares:'shares',nominalCost:'nominal',openingNetPremium:'opening',asOf:'date',note:'note',strategy:'strategy',status:'status',contracts:'contracts',openPremium:'grossInput',buybackCost:'buyback',fees:'fees',date:'tradeDate'};
    return h('div',{className:'ol-page'},h('div',{className:'ol-wrap'},
      h('header',{className:'ol-head'},h('div',null,h('div',{className:'ol-tag'},t('tag')),h('h1',null,t('title')),h('div',{className:'ol-sub'},t('subtitle'))),h('div',{className:'ol-actions'},btn(t('refresh'),refresh),btn(t('export'),exportData,false,!data||demo),btn(t('import'),()=>setForm('import'),false,demo),btn(t('position'),()=>{setP(freshPosition());setForm('position')},true,demo))),
      error&&h('div',{className:'ol-info ol-error',role:'alert'},error), notice&&h('div',{className:'ol-info ol-success',role:'status'},notice),
      demo&&h('div',{className:'ol-info ol-bar'},t('demoBanner'),btn(t('exitDemo'),()=>{setDemo(false);setForm(null)})),
      !view?h('div',{className:'ol-panel'},t('loading')):h(React.Fragment,null,
        h('div',{className:'ol-metrics'},[['holdings',view.totals.holdingSymbols],['nominalTotal',cash(view.totals.nominalTotal)],['netTotal',cash(view.totals.netPremium)],['actualTotal',cash(view.totals.actualTotal)]].map(([key,value])=>h('div',{className:'ol-card',key},h('div',{className:'ol-sub'},t(key)),h('strong',null,value)))),
        view.totals.missingPositions>0&&h('div',{className:'ol-info'},t('missing')),
        form==='position'&&!demo&&h('section',{className:'ol-panel'},h('h2',null,t('position')),h('p',{className:'ol-help'},t('positionHelp')),
          h('form',{onSubmit:e=>{e.preventDefault();action({action:'savePosition',data:p})}},h('div',{className:'ol-form'},field('symbol','symbol',p,setP),field('shares','shares',p,setP,'number'),field('nominal','nominalCost',p,setP,'number'),field('opening','openingNetPremium',p,setP,'number'),field('date','asOf',p,setP,'date'),field('note','note',p,setP)),h('p',{className:'ol-help'},t('openingHelp')),h('div',{className:'ol-actions'},h('button',{className:'ol-btn ol-primary',disabled:busy,type:'submit'},t(busy?'saving':'save')),btn(t('cancel'),()=>setForm(null))))),
        form==='trade'&&!demo&&h('section',{className:'ol-panel'},h('h2',null,t('trade')),h('p',{className:'ol-help'},t('tradeHelp')),
          h('form',{onSubmit:e=>{e.preventDefault();action({action:'saveTrade',data:tr})}},h('div',{className:'ol-form'},field('symbol','symbol',tr,setTr),field('strategy','strategy',tr,setTr,'text',[['CSP','CSP'],['CC','Covered Call']]),field('status','status',tr,setTr,'text',['open','closed','expired','assigned'].map(s=>[s,statusLabel(s)])),field('contracts','contracts',tr,setTr,'number'),field('grossInput','openPremium',tr,setTr,'number'),field('buyback','buybackCost',tr,setTr,'number'),field('fees','fees',tr,setTr,'number'),field('tradeDate','date',tr,setTr,'date'),field('note','note',tr,setTr)),h('div',{className:'ol-actions'},h('button',{className:'ol-btn ol-primary',disabled:busy,type:'submit'},t(busy?'saving':'save')),btn(t('cancel'),()=>setForm(null))))),
        form==='assignment'&&!demo&&h('section',{className:'ol-panel'},
          h('h2',null,t('assignment')),h('p',{className:'ol-help'},t('assignmentHelp')),
          h('strong',null,assignment.symbol+' · '+assignment.strategy),
          h('div',{className:'ol-form'},field('strike','strike',assignment,updateAssignment,'number'),field('multiplier','multiplier',assignment,updateAssignment,'number'),field('stockFees','stockFees',assignment,updateAssignment,'number'),assignment.strategy==='CC'&&field('assignedCost','assignedNominalCost',assignment,updateAssignment,'number'),field('assignmentDate','asOf',assignment,updateAssignment,'date')),
          assignmentPreview&&h('div',{className:'ol-info'},
            h('p',null,`${t('afterShares')}: ${assignmentPreview.record.afterShares}`),
            h('p',null,`${t('afterNominal')}: ${cash(assignmentPreview.record.afterNominalCents/100)}`),
            h('p',null,`${t('transferredLoss')}: ${cash(assignmentPreview.record.lossTransferredCents/100)}`),
            h('p',null,`${t('actualPer')}: ${cash(assignmentPreview.actualPerShare)}`)),
          h('div',{className:'ol-actions'},btn(t('preview'),previewAssignment),btn(t('confirmAssignment'),()=>action({action:'assign',data:assignment}),true,!assignmentPreview),btn(t('cancel'),()=>setForm(null)))),
        form==='import'&&!demo&&h('section',{className:'ol-panel'},h('h2',null,t('import')),h('p',{className:'ol-help'},t('importHelp')),h('label',{className:'ol-field'},t('file'),h('input',{type:'file',accept:'.json,application/json',onChange:async e=>{setIncoming(null);try{const f=e.target.files[0];if(!f)return;if(f.size>8*1024*1024)throw Error(t('fileLarge'));const v=JSON.parse(await f.text());if(!v.positions||!Array.isArray(v.trades))throw Error(t('invalidFile'));setIncoming(v);setError('')}catch(err){setError(err.message)}}})),incoming&&h('p',{className:'ol-help'},`${t('importReady')} ${t('holdings')}: ${Object.keys(incoming.positions).length} · ${t('details')}: ${incoming.trades.length}`),h('div',{className:'ol-actions'},btn(t('confirmImport'),()=>action({action:'import',data:incoming}),true,!incoming),btn(t('cancel'),()=>setForm(null)))),
        view.proposals.some(x=>x.status==='pending')&&h('section',{className:'ol-panel'},h('h2',null,t('drafts')),h('p',{className:'ol-help'},t('draftHelp')),view.proposals.filter(x=>x.status==='pending').map(d=>h('div',{className:'ol-draft',key:d.id},h('strong',null,historyLabel(d.command.action)),h('dl',null,Object.entries(d.command.data).map(([k,v])=>h(React.Fragment,{key:k},h('dt',null,fieldLabels[k]?t(fieldLabels[k]):k),h('dd',null,k==='status'?statusLabel(v):String(v))))) ,h('div',{className:'ol-actions'},btn(t('approve'),()=>action({action:'approve',id:d.id}),true),btn(t('reject'),()=>action({action:'reject',id:d.id})))))),
        h('section',{className:'ol-panel'},h('div',{className:'ol-panelhead'},h('h2',null,t('overview')),btn(t('trade'),()=>{setTr(freshTrade());setForm('trade')},false,demo)),
          view.rows.length?h('div',{className:'ol-scroll'},h('table',null,h('thead',null,h('tr',null,['symbol','shares','nominal','nominalPer','gross','net','actualPer','actual','open','actions'].map(k=>h('th',{key:k,scope:'col'},t(k))))),h('tbody',null,view.rows.map(r=>h('tr',{key:r.symbol},h('td',{className:'ol-symbol'},r.symbol),h('td',null,r.shares===null?t('noPosition'):r.shares.toLocaleString()),h('td',null,cash(r.nominalTotal)),h('td',null,cash(r.nominalPerShare)),h('td',null,cash(r.grossPremium)),h('td',{className:r.netPremium>=0?'ol-green':'ol-negative'},cash(r.netPremium)),h('td',{className:'ol-cost'},cash(r.actualPerShare)),h('td',null,cash(r.actualTotal)),h('td',null,r.openContracts),h('td',null,btn(t('edit'),()=>editPosition(r),false,demo))))))):
          h('div',{className:'ol-empty'},h(Icon,{size:36}),h('h2',null,t('empty')),h('p',{className:'ol-help'},t('emptyText')),btn(t('demo'),()=>{setDemo(true);setForm(null)}))),
        h('p',{className:'ol-help'},t('explanation')),
        h('section',{className:'ol-panel'},h('div',{className:'ol-panelhead'},h('h2',null,t('details')),h('select',{className:'ol-input ol-filter','aria-label':t('filter'),value:filter,onChange:e=>setFilter(e.target.value)},h('option',{value:''},t('allSymbols')),view.rows.map(r=>h('option',{key:r.symbol,value:r.symbol},r.symbol)))),view.trades.length?h('div',{className:'ol-scroll'},h('table',null,h('thead',null,h('tr',null,['symbol','tradeDate','strategy','status','contracts','gross','buyback','fees','netFlow','note','actions'].map(k=>h('th',{key:k},t(k))))),h('tbody',null,view.trades.filter(r=>!filter||r.symbol===filter).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>h('tr',{key:r.id},h('td',{className:'ol-symbol'},r.symbol),h('td',null,r.date),h('td',null,r.strategy),h('td',null,h('span',{className:'ol-pill'},statusLabel(r.status))),h('td',null,r.contracts),h('td',null,cash(r.grossCents/100)),h('td',null,cash(r.buybackCents/100)),h('td',null,cash(r.feesCents/100)),h('td',null,cash((r.grossCents-r.buybackCents-r.feesCents)/100)),h('td',null,r.note),h('td',null,h('div',{className:'ol-actions'},btn(t('edit'),()=>editTrade(r),false,demo),r.status==='open'&&btn(t('assignment'),()=>openAssignment(r),false,demo),btn(t('delete'),()=>{if(window.confirm(t('deleteConfirm')))action({action:'removeTrade',id:r.id})},false,demo||!!r.assignment)))))))):h('p',{className:'ol-help'},t('noTrades'))),
        h('div',{className:'ol-bar'},h('p',{className:'ol-help'},t('toolsHint')),btn(t('undo'),()=>{if(window.confirm(t('undoConfirm')))action({action:'undo'})},false,demo||!data?.history.length)),
        h('details',{className:'ol-details'},h('summary',null,t('history')),h('ul',{className:'ol-history'},view.history.map(r=>h('li',{key:r.revision},`${r.date} · ${historyLabel(r.action)} · #${r.revision}`))))),
      h('footer',{className:'ol-foot'},t('local'),h('br'),`${t('lastUpdated')}: ${seen||'—'} · ${t('revision')}: ${data?.revision??'—'}`)));
  }

  return { inject:['slots','locale','layout'], apply(ctx) {
    ctx.effect(()=>ctx.locale.register(NS,{zh:COPY,en:COPY}),'options-ledger: copy');
    const t=ctx.locale.bind(NS);
    ctx.effect(()=>{const s=document.createElement('style');s.dataset.plugin='@local/options-ledger';s.textContent=styles;document.head.appendChild(s);return()=>s.remove()},'options-ledger: styles');
    const request=async(options={})=>{const r=await fetch(new URL('api/options-ledger',document.baseURI),{credentials:'same-origin',...options});const v=await r.json();if(!r.ok)throw Error(v.error||t('error'));return v;};
    const load=signal=>request({signal});
    const mutate=command=>request({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(command)});
    ctx.slots.inject('conversation.input.dock',()=>ctx.slots.register({name:'conversation.input.dock',id:'options-ledger-summary',order:-20,locale:NS,inject:()=>({load,openLedger:()=>ctx.layout.selectPanel('options-ledger')})},ModeLedger));
    ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:'options-ledger',locale:NS,inject:()=>({load,mutate})},Dashboard));
    ctx.slots.inject('sidebar.panellist',()=>ctx.slots.register({name:'sidebar.panellist',id:'options-ledger',order:5,label:()=>t('title'),locale:NS},Icon));
  }};
}});
