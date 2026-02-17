import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Heart, Shield, Activity } from 'lucide-react';

interface StatsCardsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  debtToIncome: number;
  healthScore: number;
  totalEMI: number;
}

export function StatsCards({ monthlyIncome, monthlyExpenses, savingsRate, debtToIncome, healthScore, totalEMI }: StatsCardsProps) {
  const stats = [
    {
      title: 'Monthly Income',
      value: `₹${monthlyIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Monthly Expenses',
      value: `₹${monthlyExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: 'text-destructive',
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      icon: DollarSign,
      color: savingsRate >= 20 ? 'text-primary' : 'text-warning',
    },
    {
      title: 'Debt-to-Income',
      value: `${debtToIncome.toFixed(1)}%`,
      icon: Shield,
      color: debtToIncome < 30 ? 'text-primary' : debtToIncome < 50 ? 'text-warning' : 'text-destructive',
    },
    {
      title: 'Health Score',
      value: `${healthScore}/100`,
      icon: Heart,
      color: healthScore >= 60 ? 'text-primary' : healthScore >= 40 ? 'text-warning' : 'text-destructive',
    },
    {
      title: 'Total EMI',
      value: `₹${totalEMI.toLocaleString()}`,
      icon: Activity,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="glass-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
