import { useState, useCallback, useRef } from 'react';
import { Language, RESPONSES, SUPPORTED_LANGUAGES } from '@/lib/languages';

export function useVoice(currentLanguage: Language = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const getVoiceCode = useCallback((lang: Language) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.voiceCode || 'en-US';
  }, []);

  const speak = useCallback((text: string, langOverride?: Language) => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceCode(langOverride || currentLanguage);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    synth.speak(utterance);
  }, [currentLanguage, getVoiceCode]);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      speak(RESPONSES[currentLanguage].error);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getVoiceCode(currentLanguage);

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setFinalTranscript('');
    };

    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);

      if (current.isFinal) {
        setFinalTranscript(text);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      speak(RESPONSES[currentLanguage].error);
    };

    recognitionRef.current = recognition;
    recognition.start();
    speak(RESPONSES[currentLanguage].listening);
  }, [currentLanguage, getVoiceCode, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    speak,
    clearTranscript: () => { setTranscript(''); setFinalTranscript(''); }
  };
}
