// EMI Calculator: EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calculateDebtToIncome(totalEMI: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 100;
  return (totalEMI / monthlyIncome) * 100;
}

export function getRiskLevel(dti: number): { level: string; color: string; label: string } {
  if (dti < 30) return { level: 'safe', color: 'success', label: 'Safe' };
  if (dti < 50) return { level: 'caution', color: 'warning', label: 'Caution' };
  return { level: 'high_risk', color: 'destructive', label: 'High Risk' };
}

export function calculateFinancialHealthScore(
  savingsRate: number,
  debtToIncome: number,
  expenseVolatility: number,
  incomeStability: number
): number {
  // Score from 0-100
  const savingsScore = Math.min(savingsRate / 30, 1) * 30; // Max 30 points
  const debtScore = Math.max(0, (100 - debtToIncome) / 100) * 30; // Max 30 points
  const volatilityScore = Math.max(0, (1 - expenseVolatility)) * 20; // Max 20 points
  const stabilityScore = incomeStability * 20; // Max 20 points
  return Math.round(Math.max(0, Math.min(100, savingsScore + debtScore + volatilityScore + stabilityScore)));
}

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return Math.max(0, ((income - expenses) / income) * 100);
}

export function getExpenseVolatility(expenses: number[]): number {
  if (expenses.length < 2) return 0;
  const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
  if (mean === 0) return 0;
  const variance = expenses.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / expenses.length;
  const stdDev = Math.sqrt(variance);
  return Math.min(1, stdDev / mean); // Coefficient of variation, capped at 1
}

export function getIncomeStability(incomes: number[]): number {
  if (incomes.length < 2) return 1;
  const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  if (mean === 0) return 0;
  const variance = incomes.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / incomes.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, 1 - cv); // Higher = more stable
}

export function getFinancialStressProbability(
  savingsRate: number,
  debtToIncome: number,
  expenseVolatility: number,
  incomeStability: number
): number {
  // Logistic-like scoring model
  const factors = [
    savingsRate < 10 ? 0.3 : savingsRate < 20 ? 0.15 : 0,
    debtToIncome > 50 ? 0.3 : debtToIncome > 30 ? 0.15 : 0,
    expenseVolatility > 0.5 ? 0.2 : expenseVolatility > 0.3 ? 0.1 : 0,
    incomeStability < 0.5 ? 0.2 : incomeStability < 0.7 ? 0.1 : 0,
  ];
  return Math.min(1, factors.reduce((a, b) => a + b, 0));
}

export function getLoanDefaultRisk(
  debtToIncome: number,
  savingsRate: number,
  financialHealth: number
): number {
  const dtiRisk = debtToIncome > 50 ? 0.4 : debtToIncome > 30 ? 0.2 : 0.05;
  const savingsRisk = savingsRate < 10 ? 0.3 : savingsRate < 20 ? 0.15 : 0.05;
  const healthRisk = financialHealth < 40 ? 0.3 : financialHealth < 60 ? 0.15 : 0.05;
  return Math.min(1, dtiRisk + savingsRisk + healthRisk);
}

export function getPersonalizedTips(
  savingsRate: number,
  debtToIncome: number,
  expenseVolatility: number,
  persona: string
): string[] {
  const tips: string[] = [];
  const personaContext = getPersonaContext(persona);

  if (savingsRate < 10) {
    tips.push(`${personaContext.saveLow} Try to save at least 20% of your income.`);
  } else if (savingsRate < 20) {
    tips.push(`${personaContext.saveMed} Aim for a 20-30% savings rate.`);
  }

  if (debtToIncome > 50) {
    tips.push(`${personaContext.debtHigh} Your debt burden is critical — consider debt consolidation.`);
  } else if (debtToIncome > 30) {
    tips.push(`${personaContext.debtMed} Try to reduce EMI commitments before taking new loans.`);
  }

  if (expenseVolatility > 0.5) {
    tips.push(`${personaContext.volatile} Create a fixed monthly budget to reduce spending swings.`);
  }

  if (tips.length === 0) {
    tips.push(`${personaContext.good} Keep maintaining your healthy financial habits!`);
  }

  return tips.slice(0, 3);
}

function getPersonaContext(persona: string) {
  switch (persona) {
    case 'farmer':
      return {
        saveLow: "Like setting aside seed grain before consuming the harvest —",
        saveMed: "You're saving some, like keeping reserve grain —",
        debtHigh: "Like taking too many crop loans before the harvest comes in —",
        debtMed: "Like borrowing for fertilizer while still paying for seeds —",
        volatile: "Like unpredictable weather affecting your crop budget —",
        good: "Like a well-irrigated, well-planned farm season —",
      };
    case 'student':
      return {
        saveLow: "Like spending your entire semester stipend in the first month —",
        saveMed: "You're managing like a careful student budget —",
        debtHigh: "Like taking an education loan on top of existing debt —",
        debtMed: "Like managing tuition fees while paying for hostel —",
        volatile: "Like irregular freelance gigs making budgeting hard —",
        good: "Like a well-planned semester budget with savings —",
      };
    case 'shopkeeper':
      return {
        saveLow: "Like not keeping any cash reserve in the shop —",
        saveMed: "Like keeping some stock buffer for slow days —",
        debtHigh: "Like taking vendor credit while still paying old suppliers —",
        debtMed: "Like managing inventory costs while paying rent —",
        volatile: "Like seasonal sales making income unpredictable —",
        good: "Like a shop with steady daily sales and good margins —",
      };
    default: // salaried
      return {
        saveLow: "Like spending your entire paycheck before month-end —",
        saveMed: "You're saving, but there's room to build a bigger emergency fund —",
        debtHigh: "Like having EMIs eat up most of your paycheck —",
        debtMed: "Like managing EMIs while trying to save for goals —",
        volatile: "Like unexpected expenses throwing off your monthly budget —",
        good: "Like a well-structured salary budget with automated savings —",
      };
  }
}

export interface SafetyWarning {
  type: 'savings' | 'emi' | 'volatility' | 'borrowing';
  message: string;
  severity: 'warning' | 'critical';
}

export function getSafetyWarnings(
  savingsRate: number,
  emiBurden: number,
  expenseVolatility: number,
  recentLoans: number
): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];
  
  if (savingsRate < 10) {
    warnings.push({
      type: 'savings',
      message: `Savings rate is critically low at ${savingsRate.toFixed(1)}%. Aim for at least 20%.`,
      severity: savingsRate < 5 ? 'critical' : 'warning',
    });
  }

  if (emiBurden > 50) {
    warnings.push({
      type: 'emi',
      message: `EMI burden is ${emiBurden.toFixed(1)}% of income. This is dangerously high.`,
      severity: emiBurden > 70 ? 'critical' : 'warning',
    });
  }

  if (expenseVolatility > 0.5) {
    warnings.push({
      type: 'volatility',
      message: 'Your spending pattern is highly volatile. Consider a fixed monthly budget.',
      severity: 'warning',
    });
  }

  if (recentLoans >= 3) {
    warnings.push({
      type: 'borrowing',
      message: `You've taken ${recentLoans} loans recently. Rapid borrowing increases financial risk.`,
      severity: recentLoans >= 5 ? 'critical' : 'warning',
    });
  }

  return warnings;
}
