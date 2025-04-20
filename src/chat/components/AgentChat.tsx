import { useEffect } from "react";
import { useAgentChat } from "@/chat/hooks/useAgentChat";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ApiKeyInput } from "@/shared/components/ApiKeyInput";
import { ChatMessage } from "@/chat/components/ChatMessage";
import { ChatInput } from "@/chat/components/ChatInput";
import { ChatHeader } from "@/chat/components/ChatHeader";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ChatMessage as ChatMessageType } from "@/shared/types";
import { SuggestedQuestions } from "@/chat/components/SuggestedQuestions";
import { analyzeListingUrl } from "@/listingAnalyzer/services/listingAnalyzerService";
import { ChatType } from "@/chat/hooks/useAgentChat";

interface AgentChatProps {
  chatType?: ChatType;
}

export const AgentChat = ({ chatType = "general" }: AgentChatProps) => {
  const {
    messages,
    setMessages,
    input,
    setInput,
    isListening,
    isMuted,
    isLoading,
    errorState,
    resetError,
    showApiKeyInput,
    setShowApiKeyInput,
    selectedVoice,
    availableVoices,
    toggleMute,
    handleVoiceChange,
    retryLastMessage,
    handleSend,
    suggestions
  } = useAgentChat({ chatType });

  const addAgentMessage = (msg: ChatMessageType) => setMessages(prev => [...prev, msg]);

  const handleSelectSuggestion = (question: string) => {
    setInput(question);
    setTimeout(() => onSend(), 50);
  };

  // New onSend function to handle listing URLs first
  const onSend = async () => {
    // Run listing analyser first
    if (await analyzeListingUrl(input, addAgentMessage)) {
      setInput("");
      return;
    }
    // Otherwise fall back to original hook's handleSend
    handleSend();
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <ChatHeader 
        selectedVoice={selectedVoice}
        availableVoices={availableVoices}
        isMuted={isMuted}
        onVoiceChange={handleVoiceChange}
        onMuteToggle={toggleMute}
        chatType={chatType}
      />
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <LoadingIndicator />}
          
          {errorState && (
            <Alert variant="destructive" className="mt-4 animate-appear" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error communicating with AI service</AlertTitle>
              <AlertDescription className="mt-2">
                {errorState.message}
                <div className="mt-3 flex space-x-3">
                  <Button size="sm" variant="outline" onClick={resetError}>
                    Dismiss
                  </Button>
                  <Button size="sm" onClick={retryLastMessage} className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {!isLoading && suggestions.length > 0 && (
            <SuggestedQuestions
              suggestions={suggestions}
              onSelect={handleSelectSuggestion}
              className="mt-4"
            />
          )}
        </div>
      </ScrollArea>
      
      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={onSend}
        isLoading={isLoading}
        isListening={isListening}
        isMuted={isMuted}
        toggleListening={() => {}}
        toggleMute={toggleMute}
      />
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={() => setShowApiKeyInput(false)} />
      )}
    </div>
  );
};
