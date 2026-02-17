import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, AlertTriangle, Lightbulb } from 'lucide-react';

interface FinancialInsightsProps {
  healthScore: number;
  stressProbability: number;
  defaultRisk: number;
  tips: string[];
}

export function FinancialInsights({ healthScore, stressProbability, defaultRisk, tips }: FinancialInsightsProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <div className={`text-2xl font-display font-bold ${
              healthScore >= 60 ? 'text-primary' : healthScore >= 40 ? 'text-warning' : 'text-destructive'
            }`}>
              {healthScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Health Score</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <div className={`text-2xl font-display font-bold ${
              stressProbability < 0.3 ? 'text-primary' : stressProbability < 0.6 ? 'text-warning' : 'text-destructive'
            }`}>
              {(stressProbability * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stress Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <div className={`text-2xl font-display font-bold ${
              defaultRisk < 0.3 ? 'text-primary' : defaultRisk < 0.6 ? 'text-warning' : 'text-destructive'
            }`}>
              {(defaultRisk * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Default Risk</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Personalized Tips
          </p>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-accent/30 text-sm">
              <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
