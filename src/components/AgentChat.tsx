
import { useEffect, useState } from "react";
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
import { speak } from "@/integrations/elevenlabs/client";
import { handleListingUrl } from "@/utils/handleListingUrl";
import { SuggestedQuestions } from "./chat/SuggestedQuestions";
import { randomTip } from "@/utils/negotiationTips";
import { ChatMessage as ChatMessageType } from "@/utils/types";
import { useConversationHistory } from "@/hooks/useConversationHistory";

interface AgentChatProps {
  chatType?: ChatType;
  showConversationHistory?: boolean;
  currentConversationId?: string;
  onSelectConversation?: (conversationId: string) => void;
  onNewConversation?: () => void;
}

export const AgentChat = ({ 
  chatType = "general",
  showConversationHistory = false,
  currentConversationId,
  onSelectConversation,
  onNewConversation
}: AgentChatProps) => {
  const [localConversationId, setLocalConversationId] = useState<string | null>(currentConversationId || null);
  
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
    suggestions
  } = useAgentChat({ chatType });

  const {
    currentConversation,
    startNewConversation,
    loadConversation,
    addMessageToConversation,
    clearCurrentConversation
  } = useConversationHistory();

  // Load conversation when currentConversationId changes
  useEffect(() => {
    if (currentConversationId && currentConversationId !== localConversationId) {
      loadConversationData(currentConversationId);
    }
  }, [currentConversationId]);

  // Load conversation when currentConversation changes from hook
  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages);
      setLocalConversationId(currentConversation.conversationId);
    }
  }, [currentConversation]);

  useEffect(() => {
    if (isMuted || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.type === "agent" && lastMsg.text) {
      speak(lastMsg.text).catch(console.error);
    }
  }, [messages, isMuted]);

  const loadConversationData = async (conversationId: string) => {
    const conversation = await loadConversation(conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setLocalConversationId(conversationId);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    await loadConversationData(conversationId);
    onSelectConversation?.(conversationId);
  };

  const handleNewConversation = async () => {
    const conversationId = await startNewConversation(chatType);
    if (conversationId) {
      clearCurrentConversation();
      setLocalConversationId(conversationId);
      setMessages([]); // Clear messages for fresh start
      onNewConversation?.();
    }
  };

  const addAgentMessage = (msg: ChatMessageType) => setMessages(prev => [...prev, msg]);

  const handleSelectSuggestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleSendMessage = async () => {
    const currentInput = input;
    const analyzed = await handleListingUrl(currentInput, addAgentMessage);
    if (analyzed) {
      setInput("");
      const tipMessage = {
        id: crypto.randomUUID(),
        type: "agent" as const,
        text: `\n\n💡 Negotiation tip: ${randomTip()}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, tipMessage]);
      
      // Save messages to conversation if we have one
      if (localConversationId) {
        await addMessageToConversation(localConversationId, currentInput, 'user');
        await addMessageToConversation(localConversationId, tipMessage.text, 'assistant');
      }
      return;
    }
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
        handleSend={handleSendMessage}
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
