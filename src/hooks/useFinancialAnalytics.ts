import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useLoans } from '@/hooks/useLoans';
import { useProfile } from '@/hooks/useProfile';
import {
  calculateSavingsRate,
  calculateDebtToIncome,
  calculateFinancialHealthScore,
  getExpenseVolatility,
  getIncomeStability,
  getFinancialStressProbability,
  getLoanDefaultRisk,
  getPersonalizedTips,
  getSafetyWarnings,
} from '@/lib/financial';

export function useFinancialAnalytics() {
  const { transactions } = useTransactions();
  const { loans } = useLoans();
  const { profile } = useProfile();

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = thisMonthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpenses = thisMonthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);

    // Get last 6 months of expenses for volatility
    const last6Months: number[] = [];
    const last6MonthsIncome: number[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new Date(currentYear, currentMonth - i, 1);
      const monthExpenses = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear() && t.type === 'expense';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const monthIncome = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear() && t.type === 'income';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      last6Months.push(monthExpenses);
      last6MonthsIncome.push(monthIncome);
    }

    const expenseVolatility = getExpenseVolatility(last6Months);
    const incomeStability = getIncomeStability(last6MonthsIncome);

    const totalEMI = loans.reduce((sum, l) => sum + Number(l.emi), 0);
    const debtToIncome = calculateDebtToIncome(totalEMI, monthlyIncome || Number(profile?.monthly_income) || 1);

    const healthScore = calculateFinancialHealthScore(savingsRate, debtToIncome, expenseVolatility, incomeStability);

    const stressProbability = getFinancialStressProbability(savingsRate, debtToIncome, expenseVolatility, incomeStability);
    const defaultRisk = getLoanDefaultRisk(debtToIncome, savingsRate, healthScore);

    const persona = profile?.persona || 'salaried';
    const tips = getPersonalizedTips(savingsRate, debtToIncome, expenseVolatility, persona);

    const recentLoansCount = loans.filter((l) => {
      const d = new Date(l.created_at);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return d >= threeMonthsAgo;
    }).length;

    const warnings = getSafetyWarnings(savingsRate, debtToIncome, expenseVolatility, recentLoansCount);

    // Category breakdown for pie chart
    const categoryBreakdown = thisMonthTxns
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    // Daily spending for line chart (current month)
    const dailySpending: { date: string; amount: number }[] = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayExpenses = thisMonthTxns
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      dailySpending.push({ date: `${d}`, amount: dayExpenses });
    }

    // Monthly spending for bar chart (last 6 months)
    const monthlySpending = last6Months.map((amount, i) => {
      const m = new Date(currentYear, currentMonth - i, 1);
      return {
        month: m.toLocaleDateString('en', { month: 'short' }),
        amount,
      };
    }).reverse();

    return {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      debtToIncome,
      healthScore,
      stressProbability,
      defaultRisk,
      tips,
      warnings,
      categoryBreakdown,
      dailySpending,
      monthlySpending,
      totalEMI,
      expenseVolatility,
      incomeStability,
    };
  }, [transactions, loans, profile]);
}
