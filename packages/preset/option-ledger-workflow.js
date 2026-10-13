import {
  actualCostBasis,
  optionTradePnl,
  remainingNominalCostAfterPartialCall,
  validateCoveredCall,
  validateCspCashCoverage,
  summarizeSymbol,
} from './option-ledger-core.js';

// Local Harness-style workflow adapter. It accepts structured snapshots and never places orders.
export function analyzeWheelSnapshot(snapshot) {
  const trades = (snapshot.trades || []).map((trade) => ({
    ...trade,
    realizedPnl: trade.realizedPnl ?? optionTradePnl(trade),
  }));
  const symbols = [...new Set([...Object.keys(snapshot.positions || {}), ...trades.map((t) => t.symbol)])];
  const summaries = Object.fromEntries(symbols.map((symbol) => [symbol, summarizeSymbol({ symbol, trades, position: snapshot.positions?.[symbol] || {} })]));
  const symbol = snapshot.symbol;
  if (!symbol) return { decision: 'MANUAL_REVIEW', summaries, reason: 'symbol is required' };
  const summary = summaries[symbol] || summarizeSymbol({ symbol, trades, position: {} });
  const csp = validateCspCashCoverage({
    availableCash: snapshot.availableCash,
    openPuts: snapshot.openPuts || [],
    newPut: snapshot.newPut || null,
    cashBuffer: snapshot.cashBuffer || 0,
  });
  const cc = snapshot.proposedCall
    ? validateCoveredCall({
        callStrike: snapshot.proposedCall.strike,
        actualCostBasisValue: summary.actualCostBasis,
        contracts: snapshot.proposedCall.contracts,
        availableShares: summary.shares,
      })
    : null;
  const decision = cc
    ? cc.pass && csp.pass ? 'ALLOW' : 'BLOCK'
    : csp.pass ? 'ALLOW' : 'BLOCK';
  return { decision, symbol, summary, checks: { csp, cc }, noBrokerConnection: true };
}

export { actualCostBasis, optionTradePnl, remainingNominalCostAfterPartialCall, validateCoveredCall, validateCspCashCoverage };
