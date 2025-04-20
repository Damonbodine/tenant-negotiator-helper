
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { ChatType } from "@/chat/hooks/useAgentChat";

interface ChatHeaderProps {
  selectedVoice: string;
  availableVoices: any[];
  isMuted: boolean;
  onVoiceChange: (voice: string) => void;
  onMuteToggle: () => void;
  chatType: ChatType;
}

export function ChatHeader({
  selectedVoice,
  availableVoices,
  isMuted,
  onVoiceChange,
  onMuteToggle,
  chatType
}: ChatHeaderProps) {
  const chatTitle = {
    general: "AI Assistant",
    market: "Market Insights",
    negotiation: "Negotiation Coach"
  }[chatType];

  return (
    <div className="p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
      <div>
        <h3 className="font-medium">{chatTitle}</h3>
        <p className="text-sm text-muted-foreground">Ask me anything about rental properties</p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedVoice} onValueChange={onVoiceChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {availableVoices.map((voice: any) => (
              <SelectItem key={voice.voice_id} value={voice.voice_id}>
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={onMuteToggle}
          aria-label={isMuted ? "Unmute voice" : "Mute voice"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
