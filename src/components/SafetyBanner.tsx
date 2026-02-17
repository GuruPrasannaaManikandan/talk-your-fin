import { AlertTriangle, AlertOctagon } from 'lucide-react';
import type { SafetyWarning } from '@/lib/financial';

interface SafetyBannerProps {
  warnings: SafetyWarning[];
}

export function SafetyBanner({ warnings }: SafetyBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            w.severity === 'critical'
              ? 'bg-destructive/10 border border-destructive/30 glow-danger'
              : 'bg-warning/10 border border-warning/30 glow-warning'
          }`}
        >
          {w.severity === 'critical' ? (
            <AlertOctagon className="h-5 w-5 text-destructive shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          )}
          <span className={`text-sm ${w.severity === 'critical' ? 'text-destructive' : 'text-warning'}`}>
            {w.message}
          </span>
        </div>
      ))}
    </div>
  );
}
