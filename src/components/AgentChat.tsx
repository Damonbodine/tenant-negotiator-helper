
import { useAgentChat, ChatType } from "@/hooks/useAgentChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatInput } from "./chat/ChatInput";
import { ChatHeader } from "./chat/ChatHeader";
import { LoadingIndicator } from "./chat/LoadingIndicator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestedQuestions } from "./chat/SuggestedQuestions";

interface AgentChatProps {
  chatType?: ChatType;
}

export const AgentChat = ({ chatType = "general" }: AgentChatProps) => {
  const {
    messages,
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
    handleSend,
    toggleMute,
    handleVoiceChange,
    retryLastMessage,
    suggestions
  } = useAgentChat({ chatType });

  const handleSelectSuggestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100); // Small timeout to ensure state is updated
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
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <LoadingIndicator />}
          
          {errorState && (
            <Alert variant="destructive" className="mt-4 animate-appear">
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
        handleSend={handleSend}
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
