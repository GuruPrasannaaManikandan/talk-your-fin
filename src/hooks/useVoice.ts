import { useState, useCallback, useRef } from 'react';

interface VoiceCommand {
  intent: 'add_income' | 'add_expense' | 'check_loan' | 'show_dashboard' | 'financial_health' | 'unknown';
  amount?: number;
  category?: string;
  loanAmount?: number;
  rawText: string;
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const recognitionRef = useRef<any>(null);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    synth.speak(utterance);
  }, []);

  const parseCommand = useCallback((text: string): VoiceCommand => {
    const lower = text.toLowerCase().trim();

    // Add expense
    const expenseMatch = lower.match(/(?:add|log|record)\s+(?:an?\s+)?expense\s+(?:of\s+)?(\d+)\s*(.*)?/);
    if (expenseMatch || lower.includes('expense') || lower.includes('spent')) {
      const amountMatch = lower.match(/(\d+)/);
      const amount = amountMatch ? parseInt(amountMatch[1]) : undefined;
      const categoryWords = lower.replace(/(?:add|log|record|an?|expense|of|spent|for)\s*/gi, '').replace(/\d+/g, '').trim();
      return {
        intent: 'add_expense',
        amount,
        category: categoryWords || 'other',
        rawText: text,
      };
    }

    // Add income / salary
    const incomeMatch = lower.match(/(?:my\s+)?(?:salary|income|earning)\s+(?:is\s+)?(\d+)/);
    if (incomeMatch || lower.includes('income') || lower.includes('salary')) {
      const amountMatch = lower.match(/(\d+)/);
      return {
        intent: 'add_income',
        amount: amountMatch ? parseInt(amountMatch[1]) : undefined,
        category: 'salary',
        rawText: text,
      };
    }

    // Check loan
    if (lower.includes('loan') || lower.includes('borrow') || lower.includes('emi')) {
      const amountMatch = lower.match(/(\d+)/);
      let loanAmount = amountMatch ? parseInt(amountMatch[1]) : undefined;
      if (lower.includes('lakh')) loanAmount = (loanAmount || 0) * 100000;
      if (lower.includes('crore')) loanAmount = (loanAmount || 0) * 10000000;
      return {
        intent: 'check_loan',
        loanAmount,
        rawText: text,
      };
    }

    // Dashboard
    if (lower.includes('dashboard') || lower.includes('show') || lower.includes('overview')) {
      return { intent: 'show_dashboard', rawText: text };
    }

    // Financial health
    if (lower.includes('health') || lower.includes('how am i') || lower.includes('advice') || lower.includes('financial')) {
      return { intent: 'financial_health', rawText: text };
    }

    return { intent: 'unknown', rawText: text };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      speak('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);

      if (current.isFinal) {
        const command = parseCommand(text);
        setLastCommand(command);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [parseCommand, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    speak,
    clearCommand: () => setLastCommand(null),
  };
}
