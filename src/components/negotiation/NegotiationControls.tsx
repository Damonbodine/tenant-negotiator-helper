
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Settings, Volume2, VolumeX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NegotiationControlsProps {
  isCallActive: boolean;
  isMuted: boolean;
  startCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  openSettings: () => void;
  selectedVoice: string;
  handleVoiceChange: (voiceId: string) => void;
  availableVoices: any[];
}

export function NegotiationControls({
  isCallActive,
  isMuted,
  startCall,
  endCall,
  toggleMute,
  openSettings,
  selectedVoice,
  handleVoiceChange,
  availableVoices
}: NegotiationControlsProps) {
  if (!isCallActive) {
    return (
      <Button onClick={startCall} className="gap-2 bg-blue-600 hover:bg-blue-700">
        <Phone className="h-4 w-4" />
        Start Call
      </Button>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedVoice}
        onValueChange={handleVoiceChange}
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
        onClick={toggleMute}
        variant="outline" 
        size="icon"
        className={isMuted ? "bg-red-100 text-red-500" : ""}
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      
      <Button onClick={endCall} variant="destructive" className="gap-2">
        <PhoneOff className="h-4 w-4" />
        End Call
      </Button>
      
      <Button 
        variant="outline"
        size="icon"
        onClick={openSettings}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
