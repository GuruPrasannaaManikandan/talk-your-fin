import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoans } from '@/hooks/useLoans';
import { useProfile } from '@/hooks/useProfile';
import { calculateEMI, calculateDebtToIncome, getRiskLevel, getPersonalizedTips } from '@/lib/financial';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';

export function LoanChecker() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('10');
  const [tenure, setTenure] = useState('60');
  const [result, setResult] = useState<{
    emi: number;
    dti: number;
    risk: ReturnType<typeof getRiskLevel>;
    tips: string[];
    warning: string | null;
  } | null>(null);

  const { addLoan } = useLoans();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { speak } = useVoice();

  const handleCheck = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const n = parseInt(tenure);
    if (!p || !r || !n) return;

    const emi = calculateEMI(p, r, n);
    const monthlyIncome = Number(profile?.monthly_income) || 50000;
    const dti = calculateDebtToIncome(emi, monthlyIncome);
    const risk = getRiskLevel(dti);
    const annualIncome = monthlyIncome * 12;
    const warning = p > annualIncome * 5 ? `⚠️ Loan amount exceeds 5x your annual income (₹${annualIncome.toLocaleString()})` : null;
    const tips = getPersonalizedTips(0, dti, 0, profile?.persona || 'salaried');

    setResult({ emi, dti, risk, tips, warning });

    // Speak the result
    const message = `Your EMI would be ${Math.round(emi)} rupees per month. Debt-to-income ratio is ${dti.toFixed(1)} percent. Risk level: ${risk.label}. ${warning || ''}`;
    speak(message);
  };

  const handleSaveLoan = () => {
    if (!result) return;
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const n = parseInt(tenure);
    addLoan.mutate({
      loan_amount: p,
      interest_rate: r,
      tenure: n,
      emi: Math.round(result.emi),
      risk_score: result.dti,
      risk_level: result.risk.level,
      debt_to_income: result.dti,
    }, {
      onSuccess: () => toast({ title: 'Loan saved to history' }),
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Loan Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="500000" />
          </div>
          <div>
            <Label className="text-xs">Rate (%)</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Months</Label>
            <Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleCheck} className="w-full">Check Loan Eligibility</Button>

        {result && (
          <div className="space-y-3 animate-fade-in">
            <div className={`p-4 rounded-lg border ${
              result.risk.level === 'safe' ? 'bg-primary/10 border-primary/30' :
              result.risk.level === 'caution' ? 'bg-warning/10 border-warning/30' :
              'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Monthly EMI</span>
                  <p className="font-display font-bold text-lg">₹{Math.round(result.emi).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Level</span>
                  <p className={`font-display font-bold text-lg ${
                    result.risk.level === 'safe' ? 'text-primary' :
                    result.risk.level === 'caution' ? 'text-warning' :
                    'text-destructive'
                  }`}>{result.risk.label}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Debt-to-Income</span>
                  <p className="font-bold">{result.dti.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-bold">{result.risk.level === 'safe' ? '✅ Affordable' : result.risk.level === 'caution' ? '⚠️ Tight' : '🚫 Risky'}</p>
                </div>
              </div>
            </div>

            {result.warning && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {result.warning}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Recommended Actions:</p>
              {result.tips.map((tip, i) => (
                <p key={i} className="text-sm text-secondary-foreground">• {tip}</p>
              ))}
            </div>

            <Button variant="secondary" onClick={handleSaveLoan} className="w-full" disabled={addLoan.isPending}>
              Save to Loan History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
