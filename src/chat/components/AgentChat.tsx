
import { useAgentChat } from "@/chat/hooks/useAgentChat";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ApiKeyInput } from "@/shared/components/ApiKeyInput";
import { ChatMessage } from "@/chat/components/ChatMessage";
import { ChatInput } from "@/chat/components/ChatInput";
import { ChatHeader } from "@/chat/components/ChatHeader";
import { LoadingIndicator } from "@/chat/components/LoadingIndicator";
import { TypingIndicator } from "@/chat/components/TypingIndicator";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ChatMessage as ChatMessageType } from "@/shared/types";
import { SuggestedQuestions } from "@/chat/components/SuggestedQuestions";
import { analyzeListingUrl } from "@/listingAnalyzer/services/listingAnalyzerService";
import { ChatType } from "@/chat/hooks/useAgentChat";
import { useEffect, useRef } from "react";
import { chatPersistenceService } from "@/shared/services/chatPersistenceService";

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
    isTyping,
    isLoadingHistory,
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

  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages, isTyping]);

  // Mark messages as read when they're visible
  useEffect(() => {
    if (messages.length === 0) return;
    
    const unreadAgentMessageIds = messages
      .filter(msg => msg.type === 'agent' && msg.isRead === false)
      .map(msg => msg.id);
    
    if (unreadAgentMessageIds.length > 0) {
      // Mark messages as read and update local state
      chatPersistenceService.markMessagesAsRead(unreadAgentMessageIds)
        .then(success => {
          if (success) {
            setMessages(prev => prev.map(msg => 
              unreadAgentMessageIds.includes(msg.id) 
                ? { ...msg, isRead: true } 
                : msg
            ));
          }
        })
        .catch(error => console.error("Error marking messages as read:", error));
    }
  }, [messages, setMessages]);

  const addAgentMessage = (msg: ChatMessageType) => setMessages(prev => [...prev, msg]);

  const handleSelectSuggestion = (question: string) => {
    setInput(question);
    setTimeout(() => onSend(), 50);
  };

  const onSend = async () => {
    if (!input.trim() || isLoading) return;

    const wasListingAnalyzed = await analyzeListingUrl(input, addAgentMessage);
    if (wasListingAnalyzed) {
      setInput("");
      return;
    }
    
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
      
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4" aria-live="polite" role="log">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="animate-pulse h-4 w-4" />
                <span>Loading conversation history...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-muted-foreground">No messages yet</div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          
          {isLoading && <LoadingIndicator />}
          {isTyping && <TypingIndicator />}
          
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
          
          {!isLoading && !isTyping && suggestions.length > 0 && (
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
        isLoading={isLoading || isTyping}
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
