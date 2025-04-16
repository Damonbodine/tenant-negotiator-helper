
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatHeaderProps {
  selectedVoice: string;
  availableVoices: any[];
  isMuted: boolean;
  onVoiceChange: (voiceId: string) => void;
  onMuteToggle: () => void;
}

export function ChatHeader({
  selectedVoice,
  availableVoices,
  isMuted,
  onVoiceChange,
  onMuteToggle
}: ChatHeaderProps) {
  return (
    <div className="p-3 border-b border-border flex justify-between items-center bg-slate-50 dark:bg-slate-900">
      <h3 className="font-medium">AI Assistant</h3>
      
      <div className="flex items-center gap-2">
        <Select 
          value={selectedVoice}
          onValueChange={onVoiceChange}
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {availableVoices.length > 0 ? (
              availableVoices.map((voice) => (
                <SelectItem key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="21m00Tcm4TlvDq8ikWAM">Default Voice</SelectItem>
            )}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={onMuteToggle}
          variant="outline" 
          size="icon"
          className={isMuted ? "bg-red-100 text-red-500" : ""}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
