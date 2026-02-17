import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVoice } from '@/hooks/useVoice';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialAnalytics } from '@/hooks/useFinancialAnalytics';
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
  const { addTransaction, editTransaction, clearTransactions } = useTransactions();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en-US');
  const [debugMode, setDebugMode] = useState(false);
  const { isListening, transcript, finalTranscript, startListening, stopListening, speak, clearTranscript } = useVoice(currentLanguage);
  const { processCommand, isProcessing } = useCommandInterpreter();
  const { profile } = useProfile();
  const analytics = useFinancialAnalytics();
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'loans'>('dashboard');

  // Handle voice commands - triggers when finalTranscript changes
  useEffect(() => {
    if (finalTranscript) {
      handleProcessVoice(finalTranscript);
    }
  }, [finalTranscript]);

  const handleProcessVoice = async (text: string) => {
    speak('Processing...');

    // Process the command with the LLM
    const result = await processCommand(text);

    // Handle UI navigation or feedback based on result/intent locally if needed
    if (result) {
      // Speak the natural language response from the LLM if available
      // IMPORTANT: We must speak in the DETECTED language, not the UI language.
      // We need to update useVoice to accept a language override in speak() or we just set it here?
      // useVoice.speak uses currentLanguage state. We can't easily override it without modifying useVoice.
      // Let's modify useVoice to accept an optional language arg first? 
      // OR, we can just switch the UI language to the detected one? 
      // Switching UI language might be jarring but correct for "Talk to me in the language I spoke".
      // Let's try to map result.language_detected (e.g. "Hindi") to our Language codes.

      const detectedLangCode = SUPPORTED_LANGUAGES.find(l =>
        l.label.toLowerCase() === result.language_detected.toLowerCase() ||
        l.code.split('-')[0] === result.language_detected.toLowerCase()
      )?.code;

      if (detectedLangCode && detectedLangCode !== currentLanguage) {
        // Auto-switch language to match user? The user requested: "respond to me in the language I just talked".
        setCurrentLanguage(detectedLangCode);
        // Small delay to allow state update? speak() uses the state. 
        // React state updates aren't instant. 
        // Better: Update useVoice to accept lang override.
      }

      if (result.response) {
        // speak(result.response, detectedLangCode); 
        // Typescript might complain if detectedLangCode is undefined, so fallback to currentLanguage (undefined arg)
        speak(result.response, detectedLangCode as Language);
      } else {
        // Fallback
        if (result.intent === 'QUERY_ONLY') {
          speak("Done.");
        } else {
          speak("Updated.");
        }
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
            <LoanChecker currentLanguage={currentLanguage} />
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
