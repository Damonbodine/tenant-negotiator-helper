
import { useState, useRef } from "react";
import { useToast } from "./use-toast";
import { agentService } from "@/utils/agentService";

export function useVoiceAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const loadVoices = async () => {
    try {
      const voices = await agentService.getVoices();
      setAvailableVoices(voices);
      console.log("Available voices loaded");
    } catch (error) {
      console.error("Error loading voices:", error);
    }
  };

  const speakText = async (text: string) => {
    if (isMuted) return;

    try {
      const audioBuffer = await agentService.generateSpeech(text);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        console.log("Playing audio");
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
          });
        }
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      toast({
        title: "Speech Error",
        description: `Could not generate speech: ${(error as Error).message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
    
    toast({
      title: isMuted ? "Audio Enabled" : "Audio Disabled",
      description: isMuted ? "Agent responses will now be spoken" : "Agent responses will be text only",
    });
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    agentService.setVoice(voiceId);
    
    toast({
      title: "Voice Changed",
      description: "The agent will now use a different voice",
    });
  };

  return {
    isMuted,
    selectedVoice,
    availableVoices,
    audioRef,
    loadVoices,
    speakText,
    toggleMute,
    handleVoiceChange
  };
}
