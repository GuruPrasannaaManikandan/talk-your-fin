import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVoice } from '@/hooks/useVoice';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
import { useProfile } from '@/hooks/useProfile';
import { StatsCards } from '@/components/StatsCards';
import { DashboardCharts } from '@/components/DashboardCharts';
import { TransactionPanel } from '@/components/TransactionPanel';
import { LoanChecker } from '@/components/LoanChecker';
import { FinancialInsights } from '@/components/FinancialInsights';
import { SafetyBanner } from '@/components/SafetyBanner';
import { ProfileSettings } from '@/components/ProfileSettings';
import { VoiceButton } from '@/components/VoiceButton';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const { isListening, transcript, lastCommand, startListening, stopListening, speak, clearCommand } = useVoice();
  const { addTransaction } = useTransactions();
  const { profile } = useProfile();
  const analytics = useFinancialAnalytics();
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'loans'>('dashboard');

  // Handle voice commands
  const handleVoiceCommand = useCallback(() => {
    if (!lastCommand) return;

    switch (lastCommand.intent) {
      case 'add_expense':
        if (lastCommand.amount) {
          addTransaction.mutate(
            { type: 'expense', amount: lastCommand.amount, category: lastCommand.category || 'other' },
            {
              onSuccess: () => {
                speak(`Added expense of ${lastCommand.amount} rupees for ${lastCommand.category || 'other'}.`);
                toast({ title: `Expense added: ₹${lastCommand.amount}` });
              },
            }
          );
        } else {
          speak('I could not detect the amount. Please say something like "Add expense 2000 groceries".');
        }
        break;

      case 'add_income':
        if (lastCommand.amount) {
          addTransaction.mutate(
            { type: 'income', amount: lastCommand.amount, category: lastCommand.category || 'salary' },
            {
              onSuccess: () => {
                speak(`Added income of ${lastCommand.amount} rupees.`);
                toast({ title: `Income added: ₹${lastCommand.amount}` });
              },
            }
          );
        } else {
          speak('I could not detect the amount. Please say something like "My salary is 25000".');
        }
        break;

      case 'check_loan':
        setActiveTab('loans');
        speak('Opening the loan checker. Please enter the loan details to check eligibility.');
        break;

      case 'show_dashboard':
        setActiveTab('dashboard');
        speak(`Here's your dashboard. Your health score is ${analytics.healthScore} out of 100. Monthly income is ${analytics.monthlyIncome} rupees and expenses are ${analytics.monthlyExpenses} rupees.`);
        break;

      case 'financial_health':
        const healthMsg = `Your financial health score is ${analytics.healthScore} out of 100. Savings rate is ${analytics.savingsRate.toFixed(1)} percent. Debt-to-income ratio is ${analytics.debtToIncome.toFixed(1)} percent. Financial stress probability is ${(analytics.stressProbability * 100).toFixed(0)} percent. ${analytics.tips[0] || ''}`;
        speak(healthMsg);
        break;

      default:
        speak('I didn\'t understand that. You can say things like "Add expense 2000 groceries", "My salary is 25000", "Check loan", or "How is my financial health".');
    }
    clearCommand();
  }, [lastCommand, addTransaction, speak, clearCommand, analytics, toast]);

  // Trigger command handling when lastCommand changes
  if (lastCommand) {
    handleVoiceCommand();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-bold gradient-text">🏆 FinBridge</h1>
            <div className="hidden md:flex gap-1">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'loans' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('loans')}
              >
                Loans
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice indicator */}
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary font-medium">Listening...</span>
              </div>
            )}

            {transcript && (
              <span className="hidden md:block text-xs text-muted-foreground max-w-48 truncate">
                "{transcript}"
              </span>
            )}

            <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />

            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">
              Hello, {profile?.name || user?.email?.split('@')[0] || 'there'} 👋
            </h2>
            <p className="text-muted-foreground text-sm">
              {profile?.persona === 'student' ? '🎓 Student' : profile?.persona === 'farmer' ? '🌾 Farmer' : profile?.persona === 'shopkeeper' ? '🏪 Shopkeeper' : '💼 Salaried Worker'} •
              Say <span className="text-primary font-medium">"Start Voice Mode"</span> or click the mic
            </p>
          </div>
          {/* Mobile tab switcher */}
          <div className="flex md:hidden gap-1">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'loans' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('loans')}
            >
              Loans
            </Button>
          </div>
        </div>

        {/* Safety Warnings */}
        <SafetyBanner warnings={analytics.warnings} />

        {showSettings && (
          <div className="animate-fade-in">
            <ProfileSettings />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <StatsCards
              monthlyIncome={analytics.monthlyIncome}
              monthlyExpenses={analytics.monthlyExpenses}
              savingsRate={analytics.savingsRate}
              debtToIncome={analytics.debtToIncome}
              healthScore={analytics.healthScore}
              totalEMI={analytics.totalEMI}
            />

            <DashboardCharts
              dailySpending={analytics.dailySpending}
              monthlySpending={analytics.monthlySpending}
              categoryBreakdown={analytics.categoryBreakdown}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TransactionPanel />
              <FinancialInsights
                healthScore={analytics.healthScore}
                stressProbability={analytics.stressProbability}
                defaultRisk={analytics.defaultRisk}
                tips={analytics.tips}
              />
            </div>
          </>
        )}

        {activeTab === 'loans' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LoanChecker />
            <FinancialInsights
              healthScore={analytics.healthScore}
              stressProbability={analytics.stressProbability}
              defaultRisk={analytics.defaultRisk}
              tips={analytics.tips}
            />
          </div>
        )}
      </main>
    </div>
  );
}
