
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, Mic, VolumeX, Volume2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isListening?: boolean;
  isMuted?: boolean;
  toggleListening?: () => void;
  toggleMute?: () => void;
}

export function ChatInput({ 
  input, 
  setInput, 
  handleSend, 
  isLoading, 
  isListening, 
  isMuted,
  toggleListening,
  toggleMute 
}: ChatInputProps) {
  return (
    <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                handleSend();
              }
            }
          }}
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <div className="flex flex-col gap-2">
          {toggleMute && (
            <Button 
              size="icon" 
              variant="outline" 
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute voice" : "Mute voice"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          
          {toggleListening && (
            <Button 
              size="icon" 
              variant={isListening ? "destructive" : "outline"}
              onClick={toggleListening}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
