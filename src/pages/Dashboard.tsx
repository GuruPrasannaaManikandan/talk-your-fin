import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVoice } from '@/hooks/useVoice';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
import { useLoans } from '@/hooks/useLoans';
import { useProfile } from '@/hooks/useProfile';
import { useCommandInterpreter } from '@/hooks/useCommandInterpreter';
import { StatsCards } from '@/components/StatsCards';
import { DashboardCharts } from '@/components/DashboardCharts';
import { TransactionPanel } from '@/components/TransactionPanel';
import { LoanChecker } from '@/components/LoanChecker';
import { FinancialInsights } from '@/components/FinancialInsights';
import { SafetyBanner } from '@/components/SafetyBanner';
import { ProfileSettings } from '@/components/ProfileSettings';
import { VoiceButton } from '@/components/VoiceButton';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Language, SUPPORTED_LANGUAGES } from '@/lib/languages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const { addLoan } = useLoans();
  const { clearTransactions } = useTransactions();
  const { profile } = useProfile();
  const { toast } = useToast();

  const {
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    debtToIncome,
    healthScore,
    totalEMI,
    stressProbability,
    defaultRisk,
    tips,
    warnings,
    categoryBreakdown,
    dailySpending,
    monthlySpending,
    expenseVolatility,
    incomeStability
  } = useFinancialAnalytics();

  const analytics = {
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    debtToIncome,
    healthScore,
    totalEMI,
    stressProbability,
    defaultRisk,
    tips,
    warnings,
    categoryBreakdown,
    dailySpending,
    monthlySpending,
    expenseVolatility,
    incomeStability
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en-US');
  const [showSettings, setShowSettings] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const {
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    speak,
    clearTranscript
  } = useVoice(currentLanguage);

  const { processCommand, isProcessing } = useCommandInterpreter();


  // Loan Logic Lifted State
  const [loanPrincipal, setLoanPrincipal] = useState('500000');
  const [loanRate, setLoanRate] = useState('10');
  const [loanTenure, setLoanTenure] = useState('60');
  const [loanSimulation, setLoanSimulation] = useState<any>(null);

  const handleCheckLoan = async () => {
    const p = parseFloat(loanPrincipal);
    const r = parseFloat(loanRate);
    const n = parseInt(loanTenure);
    if (!p || !r || !n) return;

    // Dynamically import financial utils
    const {
      calculateEMI,
      calculateDebtToIncome,
      getRiskLevel,
      getPersonalizedTips,
      calculateFinancialHealthScore,
      getFinancialStressProbability
    } = await import('@/lib/financial');

    const newEMI = calculateEMI(p, r, n);
    const newTotalEMI = analytics.totalEMI + newEMI;
    const effectiveIncome = analytics.monthlyIncome || Number(profile?.monthly_income) || 50000;
    const newDTI = calculateDebtToIncome(newTotalEMI, effectiveIncome);

    // We keep savingsRate etc constant for simulation for now
    const newHealthScore = calculateFinancialHealthScore(
      analytics.savingsRate,
      newDTI,
      analytics.expenseVolatility,
      analytics.incomeStability
    );

    const newStressProbability = getFinancialStressProbability(
      analytics.savingsRate,
      newDTI,
      analytics.expenseVolatility,
      analytics.incomeStability
    );

    const risk = getRiskLevel(newDTI);
    const annualIncome = effectiveIncome * 12;
    const warning = p > annualIncome * 5 ? `⚠️ Loan amount exceeds 5x your annual income (₹${annualIncome.toLocaleString()})` : null;
    const tips = getPersonalizedTips(analytics.savingsRate, newDTI, analytics.expenseVolatility, profile?.persona || 'salaried');

    const simulationData = {
      emi: newEMI,
      before: {
        dti: analytics.debtToIncome,
        healthScore: analytics.healthScore,
        stress: analytics.stressProbability,
      },
      after: {
        dti: newDTI,
        healthScore: newHealthScore,
        stress: newStressProbability,
      },
      risk,
      tips,
      warning
    };

    setLoanSimulation(simulationData);

    // Speak results
    const { getFinancialAdvice } = await import('@/lib/interpreter');
    const fallbackText = `Your new monthly EMI will be ${Math.round(newEMI)}. Your Debt to Income ratio will go from ${analytics.debtToIncome.toFixed(1)} percent to ${newDTI.toFixed(1)} percent. Risk level is ${risk.label}.`;

    try {
      const aiResponse = await getFinancialAdvice({
        type: 'loan_simulation',
        emi: Math.round(newEMI),
        risk: risk.label,
        warning,
        before: {
          dti: analytics.debtToIncome.toFixed(1),
          healthScore: analytics.healthScore,
          stress: (analytics.stressProbability * 100).toFixed(0)
        },
        after: {
          dti: newDTI.toFixed(1),
          healthScore: newHealthScore,
          stress: (newStressProbability * 100).toFixed(0)
        },
        tips
      }, currentLanguage);
      speak(aiResponse || fallbackText);
    } catch (e) {
      console.error(e);
      speak(fallbackText);
    }
  };

  const handleSaveLoan = () => {
    if (!loanSimulation) return;
    addLoan.mutate({
      loan_amount: parseFloat(loanPrincipal),
      interest_rate: parseFloat(loanRate),
      tenure: parseInt(loanTenure),
      emi: Math.round(loanSimulation.emi),
      risk_score: loanSimulation.after.dti,
      risk_level: loanSimulation.risk.level,
      debt_to_income: loanSimulation.after.dti,
    }, {
      onSuccess: () => toast({ title: 'Loan saved to history' }),
    });
  };

  // Handle voice commands - triggers when finalTranscript changes
  useEffect(() => {
    if (finalTranscript) {
      handleProcessVoice(finalTranscript);
    }
  }, [finalTranscript]);

  const executeSimulation = async (p: number, r: number, n: number) => {
    speak("Generating impact report...", currentLanguage);
    toast({ title: "Generating Report", description: "Analyzing loan impact..." });

    // Dynamically import financial utils
    const {
      calculateEMI,
      calculateDebtToIncome,
      getRiskLevel,
      getPersonalizedTips,
      calculateFinancialHealthScore,
      getFinancialStressProbability
    } = await import('@/lib/financial');

    const newEMI = calculateEMI(p, r, n);
    const newTotalEMI = analytics.totalEMI + newEMI;
    const effectiveIncome = analytics.monthlyIncome || Number(profile?.monthly_income) || 50000;
    const newDTI = calculateDebtToIncome(newTotalEMI, effectiveIncome);

    // We keep savingsRate etc constant for simulation for now
    const newHealthScore = calculateFinancialHealthScore(
      analytics.savingsRate,
      newDTI,
      analytics.expenseVolatility,
      analytics.incomeStability
    );

    const newStressProbability = getFinancialStressProbability(
      analytics.savingsRate,
      newDTI,
      analytics.expenseVolatility,
      analytics.incomeStability
    );

    const risk = getRiskLevel(newDTI);
    const annualIncome = effectiveIncome * 12;
    const warning = p > annualIncome * 5 ? `⚠️ Loan amount exceeds 5x your annual income (₹${annualIncome.toLocaleString()})` : null;
    const tips = getPersonalizedTips(analytics.savingsRate, newDTI, analytics.expenseVolatility, profile?.persona || 'salaried');

    const simulationData = {
      emi: newEMI,
      before: {
        dti: analytics.debtToIncome,
        healthScore: analytics.healthScore,
        stress: analytics.stressProbability,
      },
      after: {
        dti: newDTI,
        healthScore: newHealthScore,
        stress: newStressProbability,
      },
      risk,
      tips,
      warning
    };

    setLoanSimulation(simulationData);

    // Speak results
    const { getFinancialAdvice } = await import('@/lib/interpreter');
    const fallbackText = `Your new monthly EMI will be ${Math.round(newEMI)}. Your Debt to Income ratio will go from ${analytics.debtToIncome.toFixed(1)} percent to ${newDTI.toFixed(1)} percent. Risk level is ${risk.label}.`;

    try {
      // Pass currentLanguage code, interpreter will look up the label
      const aiResponse = await getFinancialAdvice({
        type: 'loan_simulation',
        emi: Math.round(newEMI),
        risk: risk.label,
        warning,
        before: {
          dti: analytics.debtToIncome.toFixed(1),
          healthScore: analytics.healthScore,
          stress: (analytics.stressProbability * 100).toFixed(0)
        },
        after: {
          dti: newDTI.toFixed(1),
          healthScore: newHealthScore,
          stress: (newStressProbability * 100).toFixed(0)
        },
        tips
      }, currentLanguage);

      speak(aiResponse || fallbackText, currentLanguage);
    } catch (e: any) {
      console.error(e);
      // Show the actual error in a toast for easier debugging
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: e.message || "Unknown error occurred"
      });
      speak(fallbackText, currentLanguage);
    }
  };

  const handleProcessVoice = async (text: string) => {
    speak('Processing...');

    // Process the command with the LLM
    const result = await processCommand(text);

    if (result) {
      const detectedLangCode = SUPPORTED_LANGUAGES.find(l =>
        l.label.toLowerCase() === result.language_detected.toLowerCase() ||
        l.code.split('-')[0] === result.language_detected.toLowerCase()
      )?.code;

      if (detectedLangCode && detectedLangCode !== currentLanguage) {
        setCurrentLanguage(detectedLangCode);
      }

      if (result.intent === 'SIMULATE_LOAN') {
        setActiveTab('loans');
        let p = parseFloat(loanPrincipal);
        if (result.amount) {
          setLoanPrincipal(result.amount.toString());
          p = result.amount;
        }
        await executeSimulation(p, parseFloat(loanRate), parseInt(loanTenure));
      } else if (result.response) {
        speak(result.response, detectedLangCode as Language);
      } else if (result.intent === 'QUERY_ONLY') {
        speak("Done.");
      } else {
        speak("Updated.");
      }
    } else {
      speak("I didn't understand that.");
    }

    clearTranscript();
  };


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
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <Globe className="h-4 w-4" />
                  {SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => setCurrentLanguage(lang.code)}>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice indicator */}
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary font-medium">Listening...</span>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <Loader2 className="h-3 w-3 animate-spin text-yellow-600" />
                <span className="text-xs text-yellow-600 font-medium">Processing...</span>
              </div>
            )}

            {transcript && (
              <span className="hidden md:block text-xs text-muted-foreground max-w-48 truncate">
                "{transcript}"
              </span>
            )}

            {/* Debug Toggle */}
            <Button
              variant={debugMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="hidden sm:flex gap-2"
            >
              🐛
            </Button>

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
              Say <span className="text-primary font-medium">"My income is 50000"</span> or <span className="text-primary font-medium">"Spent 200 on food"</span>
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

        {/* Debug Panel */}
        {debugMode && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                🐛 Debug Panel
              </h3>
              <span className="text-xs text-muted-foreground">Language: {currentLanguage}</span>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground min-w-24">Raw Transcript:</span>
                <span className="text-primary font-mono">{transcript || '(none)'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground min-w-24">Processing:</span>
                <span className="font-mono">{isProcessing ? 'YES' : 'NO'}</span>
              </div>
              <div className="pt-2 border-t border-border mt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    if (confirm("ARE YOU SURE? This will delete ALL transactions and reset income.")) {
                      await clearTransactions.mutateAsync();
                      // Also reset profile income
                      const { supabase } = await import('@/integrations/supabase/client');
                      await supabase.from('profiles').update({ monthly_income: 0 }).eq('user_id', user?.id);

                      toast({ title: "Data Reset", description: "All data cleared successfully." });
                      window.location.reload();
                    }
                  }}
                >
                  ⚠️ EMERGENCY RESET DATA
                </Button>
              </div>
            </div>
          </div>
        )}

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
            <LoanChecker
              currentLanguage={currentLanguage}
              principal={loanPrincipal}
              setPrincipal={setLoanPrincipal}
              rate={loanRate}
              setRate={setLoanRate}
              tenure={loanTenure}
              setTenure={setLoanTenure}
              simulation={loanSimulation}
              onCheck={handleCheckLoan}
              onSave={handleSaveLoan}
            />
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
