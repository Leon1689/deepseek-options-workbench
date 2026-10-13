// Deterministic local core for the custom symbol-scoped options strategy.
// No broker/network access. The browser UI and a future Harness tool can share this logic.

export function optionTradePnl({ openPremium = 0, buybackCost = 0, fees = 0 }) {
  return Number(openPremium) - Number(buybackCost) - Number(fees);
}

export function remainingNominalCostAfterPartialCall({
  beforeNominalCost,
  originalNominalPerShare,
  sharesAssignedOut,
  callStrike,
}) {
  const before = Number(beforeNominalCost);
  const original = Number(originalNominalPerShare);
  const sold = Number(sharesAssignedOut);
  const strike = Number(callStrike);
  if ([before, original, sold, strike].some((v) => !Number.isFinite(v)) || sold < 0) {
    throw new Error('Invalid partial Covered Call inputs');
  }
  if (before < 0 || original <= 0 || strike < 0 || sold * original > before) throw new Error('Invalid assigned stock cost');
  const unassignedCost = before - original * sold;
  return unassignedCost > 0 ? unassignedCost + Math.max(0, (original - strike) * sold) : 0;
}

export function actualCostBasis({ remainingNominalCost, cumulativeOptionPnl, remainingShares }) {
  const nominal = Number(remainingNominalCost);
  const pnl = Number(cumulativeOptionPnl);
  const shares = Number(remainingShares);
  if (![nominal, pnl, shares].every(Number.isFinite) || shares <= 0) {
    return null;
  }
  return (nominal - pnl) / shares;
}

export function validateCspCashCoverage({
  availableCash,
  openPuts = [],
  newPut = null,
  cashBuffer = 0,
  contractMultiplier = 100,
}) {
  const puts = newPut ? [...openPuts, newPut] : openPuts;
  const requirement = puts.reduce(
    (sum, put) => sum + Number(put.contracts) * Number(put.strike) * Number(put.contractMultiplier || contractMultiplier),
    0,
  );
  const available = Number(availableCash);
  const buffer = Number(cashBuffer);
  const pass = Number.isFinite(available) && Number.isFinite(buffer) && available - requirement - buffer >= 0;
  return { pass, requirement, remainingAfterBuffer: available - requirement - buffer };
}

export function validateCoveredCall({
  callStrike,
  actualCostBasisValue,
  contracts,
  availableShares,
  contractMultiplier = 100,
}) {
  const strike = Number(callStrike);
  const actual = Number(actualCostBasisValue);
  const requiredShares = Number(contracts) * Number(contractMultiplier);
  const shares = Number(availableShares);
  const strikePass = Number.isFinite(strike) && Number.isFinite(actual) && strike > actual;
  const coveragePass = Number.isFinite(requiredShares) && Number.isFinite(shares) && requiredShares <= shares;
  return {
    pass: strikePass && coveragePass,
    strikePass,
    coveragePass,
    requiredShares,
    availableShares: shares,
  };
}

export function summarizeSymbol({ symbol, trades = [], position = {} }) {
  const symbolTrades = trades.filter((trade) => trade.symbol === symbol);
  const cumulativeOptionPnl = symbolTrades.reduce((sum, trade) => sum + Number(trade.realizedPnl || 0), 0);
  const shares = Number(position.shares || 0);
  const nominalCost = Number(position.nominalCost || 0);
  return {
    symbol,
    shares,
    nominalCost,
    nominalCostPerShare: shares > 0 ? nominalCost / shares : null,
    cumulativeOptionPnl,
    actualCostBasis: actualCostBasis({ remainingNominalCost: nominalCost, cumulativeOptionPnl, remainingShares: shares }),
  };
}

export function validateTradeRecord(trade) {
  const required = ['symbol', 'strategy', 'openPremium', 'buybackCost', 'fees'];
  const missing = required.filter((field) => trade[field] === undefined || trade[field] === null || trade[field] === '');
  const numericFields = ['openPremium', 'buybackCost', 'fees', 'contracts'];
  const invalidNumbers = numericFields.filter((field) => trade[field] !== undefined && !Number.isFinite(Number(trade[field])));
  return { valid: missing.length === 0 && invalidNumbers.length === 0, missing, invalidNumbers };
}
