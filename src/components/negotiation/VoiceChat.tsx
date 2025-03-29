
import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Headphones, Mic, MicOff, ShieldAlert, ShieldCheck, Volume2 } from "lucide-react";
import { Message } from "@/hooks/useVoiceNegotiation";

interface VoiceChatProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isListening: boolean;
  isCallActive: boolean;
  toggleListening: () => void;
  handleSend: () => void;
  microphoneAccessState?: 'granted' | 'denied' | 'prompt' | 'error' | null;
}

export function VoiceChat({
  messages,
  input,
  setInput,
  isLoading,
  isListening,
  isCallActive,
  toggleListening,
  handleSend,
  microphoneAccessState
}: VoiceChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  // Helper to render microphone button with appropriate state
  const renderMicButton = () => {
    // If not actively listening, show the default mic button with state information
    if (!isListening) {
      // Different button states based on mic permission
      if (microphoneAccessState === 'denied') {
        return (
          <Button 
            onClick={toggleListening}
            variant="outline" 
            size="icon"
            className="bg-red-100 text-red-500"
            title="Microphone access denied. Click to request permission again."
            disabled={!isCallActive}
          >
            <ShieldAlert className="h-4 w-4" />
          </Button>
        );
      } else if (microphoneAccessState === 'granted') {
        return (
          <Button 
            onClick={toggleListening}
            variant="outline" 
            size="icon"
            className="bg-green-100 text-green-500"
            title="Microphone access granted. Click to start speaking."
            disabled={!isCallActive}
          >
            <Mic className="h-4 w-4" />
          </Button>
        );
      } else {
        // Default state (prompt or unknown)
        return (
          <Button 
            onClick={toggleListening}
            variant="outline" 
            size="icon"
            title="Click to start speaking (will request microphone permission)"
            disabled={!isCallActive}
          >
            <Mic className="h-4 w-4" />
          </Button>
        );
      }
    } else {
      // Currently listening - show stop button
      return (
        <Button 
          onClick={toggleListening}
          variant="outline" 
          size="icon"
          className="bg-red-100 text-red-500 animate-pulse"
          title="Currently listening. Click to stop."
          disabled={!isCallActive}
        >
          <MicOff className="h-4 w-4" />
        </Button>
      );
    }
  };
  
  // Render the active chat interface
  const renderActiveChat = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card 
                className={`
                  max-w-[80%] p-3
                  ${message.type === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-card border border-border"}
                `}
              >
                <p>{message.text}</p>
                <div 
                  className={`
                    text-xs mt-1 
                    ${message.type === "user" ? "text-blue-100" : "text-muted-foreground"}
                  `}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-3 bg-card border border-border">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300" />
                </div>
              </Card>
            </div>
          )}
          {isListening && (
            <div className="flex justify-end">
              <Card className="max-w-[80%] p-3 bg-red-50 border border-red-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse delay-300" />
                  <span className="text-sm text-red-500">Listening...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
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
            disabled={!isCallActive}
          />
          <div className="flex flex-col gap-2">
            {renderMicButton()}
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={isLoading || !input.trim() || !isCallActive}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render the placeholder when call is not active
  const renderPlaceholder = () => (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Headphones className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Ready to Practice?</h3>
        <p className="text-muted-foreground mb-4">
          Select a scenario from the right panel and click "Start Call" to begin your negotiation practice session.
        </p>
        {microphoneAccessState === 'denied' && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
            <div className="flex items-center mb-2">
              <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
              <span className="font-medium text-red-600">Microphone access denied</span>
            </div>
            <p className="text-sm text-red-700">You'll need to enable microphone access in your browser settings to use voice features.</p>
          </div>
        )}
      </div>
    </div>
  );
  
  return isCallActive ? renderActiveChat() : renderPlaceholder();
}
