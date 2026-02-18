import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoans } from '@/hooks/useLoans';
import { useProfile } from '@/hooks/useProfile';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
import {
  calculateEMI,
  calculateDebtToIncome,
  getRiskLevel,
  getPersonalizedTips,
  calculateFinancialHealthScore,
  getFinancialStressProbability
} from '@/lib/financial';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';
import { getFinancialAdvice } from '@/lib/interpreter';
import { Language } from '@/lib/languages';
import { ArrowRight, Info } from 'lucide-react';

interface LoanCheckerProps {
  currentLanguage: Language;
  principal: string;
  setPrincipal: (val: string) => void;
  rate: string;
  setRate: (val: string) => void;
  tenure: string;
  setTenure: (val: string) => void;
  simulation: any;
  onCheck: () => void;
  onSave: () => void;
}

export function LoanChecker({
  currentLanguage,
  principal, setPrincipal,
  rate, setRate,
  tenure, setTenure,
  simulation,
  onCheck,
  onSave
}: LoanCheckerProps) {
  const { addLoan, loans, deleteLoan } = useLoans();
  const { toast } = useToast();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          Loan Impact Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="500000" />
          </div>
          <div>
            <Label className="text-xs">Rate (%)</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Tenure (Months)</Label>
            <Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
          </div>
        </div>

        <Button onClick={onCheck} className="w-full bg-primary hover:bg-primary/90 text-white">
          Simulate Impact
        </Button>

        {simulation && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Summary Banner */}
            <div className={`p-4 rounded-lg border flex items-center justify-between ${simulation.risk.level === 'safe' ? 'bg-primary/10 border-primary/30' :
                simulation.risk.level === 'caution' ? 'bg-warning/10 border-warning/30' :
                  'bg-destructive/10 border-destructive/30'
              }`}>
              <div>
                <p className="text-sm font-medium opacity-80">New Monthly EMI</p>
                <p className="text-2xl font-bold font-display">₹{Math.round(simulation.emi).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">Risk Assessment</p>
                <p className={`text-xl font-bold ${simulation.risk.level === 'safe' ? 'text-primary' :
                    simulation.risk.level === 'caution' ? 'text-warning' :
                      'text-destructive'
                  }`}>{simulation.risk.label}</p>
              </div>
            </div>

            {/* Impact Comparison Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-card/50 rounded-lg border space-y-2">
                <p className="text-xs text-muted-foreground">Debt-to-Income</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">{simulation.before.dti.toFixed(1)}%</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mb-1" />
                  <div className="text-right">
                    <span className={`text-lg font-bold ${simulation.after.dti > 40 ? 'text-destructive' : 'text-primary'
                      }`}>{simulation.after.dti.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-card/50 rounded-lg border space-y-2">
                <p className="text-xs text-muted-foreground">Financial Health</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">{simulation.before.healthScore}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mb-1" />
                  <div className="text-right">
                    <span className={`text-lg font-bold ${simulation.after.healthScore < simulation.before.healthScore ? 'text-warning' : 'text-primary'
                      }`}>{simulation.after.healthScore}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-card/50 rounded-lg border space-y-2">
                <p className="text-xs text-muted-foreground">Stress Probability</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">{(simulation.before.stress * 100).toFixed(0)}%</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mb-1" />
                  <div className="text-right">
                    <span className={`text-lg font-bold ${simulation.after.stress > simulation.before.stress ? 'text-destructive' : 'text-primary'
                      }`}>{(simulation.after.stress * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {simulation.warning && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{simulation.warning}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Personalized Insights</p>
              <ul className="space-y-1">
                {simulation.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-secondary-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="secondary" onClick={onSave} className="w-full" disabled={addLoan.isPending}>
              Save to Loan History
            </Button>
          </div>
        )}

        {/* Loan History Section */}
        <div className="pt-6 border-t">
          <h3 className="font-display font-semibold mb-4">Loan History</h3>
          <div className="space-y-3">
            {loans?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved loans yet.</p>
            ) : (
              loans.map((loan: any) => (
                <div key={loan.id} className="p-3 bg-secondary/20 rounded-lg border flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">₹{loan.loan_amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${loan.risk_level === 'safe' ? 'bg-green-500/10 text-green-500' :
                        loan.risk_level === 'caution' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                        {loan.risk_level?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      EMI: ₹{loan.emi.toLocaleString()} • {loan.tenure}m @ {loan.interest_rate}%
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteLoan.mutate(loan.id, {
                      onSuccess: () => toast({ title: 'Loan deleted' })
                    })}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
