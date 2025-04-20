
import { useRef } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { agentService } from "@/shared/services/agentService";

export function useVoiceSettings() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleVoiceChange = (voiceId: string) => {
    agentService.setVoice(voiceId);
    toast({
      title: "Voice Changed",
      description: "The agent will now use a different voice",
    });
  };

  const toggleMute = (isMuted: boolean, setIsMuted: (muted: boolean) => void) => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (!newMuted && audioRef.current) {
      audioRef.current.pause();
    }
    
    toast({
      title: newMuted ? "Audio Disabled" : "Audio Enabled",
      description: newMuted ? "Agent responses will be text only" : "Agent responses will now be spoken",
    });
  };

  return {
    audioRef,
    mediaRecorderRef,
    audioChunksRef,
    handleVoiceChange,
    toggleMute
  };
}
