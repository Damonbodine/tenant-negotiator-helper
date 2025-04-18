
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ChatType } from "@/hooks/useAgentChat";

interface ChatHeaderProps {
  selectedVoice: string;
  availableVoices: any[];
  isMuted: boolean;
  chatType?: ChatType;
  onMuteToggle: () => void;
  onVoiceChange: (voiceId: string) => void;
}

export function ChatHeader({ 
  selectedVoice,
  availableVoices,
  isMuted,
  chatType,
  onMuteToggle,
  onVoiceChange
}: ChatHeaderProps) {
  const getChatTypeLabel = () => {
    switch(chatType) {
      case "market": return "Market Analysis";
      case "negotiation": return "Negotiation Coach";
      default: return "General Assistant";
    }
  };
  
  return (
    <div className="border-b p-4 flex items-center justify-between bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold">AI Assistant</h2>
        {chatType && (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
            {getChatTypeLabel()}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onMuteToggle}>
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? 'Unmute responses' : 'Mute responses'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {availableVoices.length > 0 && (
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
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Using GPT-4.1 with automatic fallback to GPT-4o if needed.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
