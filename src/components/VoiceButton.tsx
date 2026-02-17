import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceButton({ isListening, onStart, onStop }: VoiceButtonProps) {
  return (
    <Button
      onClick={isListening ? onStop : onStart}
      size="lg"
      className={`rounded-full h-14 w-14 ${isListening ? 'bg-destructive hover:bg-destructive/90 voice-pulse' : 'bg-primary hover:bg-primary/90'}`}
    >
      {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
    </Button>
  );
}
