
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isListening: boolean;
  isMuted: boolean;
  toggleListening: () => void;
  toggleMute: () => void;
}

export function ChatInput({
  input,
  setInput,
  handleSend,
  isLoading,
  isListening,
  isMuted,
  toggleListening,
  toggleMute,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Message input"
        />
        <div className="flex flex-col gap-2">
          <Button 
            onClick={toggleListening}
            variant="outline" 
            size="icon"
            className={isListening ? "bg-red-100 text-red-500" : ""}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={toggleMute}
            variant="outline" 
            size="icon"
            className={isMuted ? "bg-red-100 text-red-500" : ""}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
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
