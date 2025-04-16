import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";
import { voiceClient } from "@/utils/voiceClient";
import { knowledgeBaseService } from "@/utils/knowledgeBase";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { ChatMessage } from "./chat/ChatMessage";
import { ChatInput } from "./chat/ChatInput";
import { ChatHeader } from "./chat/ChatHeader";
import { LoadingIndicator } from "./chat/LoadingIndicator";

type MessageType = "user" | "agent";
type ChatType = "market" | "negotiation" | "general";

interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface AgentChatProps {
  chatType?: ChatType;
}

export const AgentChat = ({ chatType = "general" }: AgentChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM"); // Rachel voice
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    
    // Add initial welcome message based on chat type
    if (messages.length === 0) {
      let welcomeMessage = "";
      
      switch (chatType) {
        case "market":
          welcomeMessage = "Hello! I can help you understand rental market trends and pricing. What area are you interested in learning about?";
          break;
        case "negotiation":
          welcomeMessage = "Welcome! I'm your negotiation coach. I can provide tips and strategies to help you secure a better rental deal. What would you like to know?";
          break;
        default:
          welcomeMessage = "Hello! I'm your Rent Negotiator Assistant. How can I help you today?";
      }
      
      const initialMessage: Message = {
        id: "welcome",
        type: "agent",
        text: welcomeMessage,
        timestamp: new Date()
      };
      
      setMessages([initialMessage]);
      
      // Check if API key is set, if not, prompt user
      const checkApiKey = async () => {
        if (!(await agentService.hasApiKey())) {
          setShowApiKeyInput(true);
        } else {
          // Load available voices if API key is set
          loadVoices();
        }
      };
      
      checkApiKey();
    }
  }, [messages.length, chatType]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const loadVoices = async () => {
    try {
      const voices = await agentService.getVoices();
      setAvailableVoices(voices);
      console.log("Available voices:", voices);
    } catch (error) {
      console.error("Error loading voices:", error);
      // Don't show error toast here, as it might be normal when API key isn't set
    }
  };
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Check if API key is set
      if (!(await agentService.hasApiKey())) {
        setShowApiKeyInput(true);
        setIsLoading(false);
        return;
      }
      
      // Get response based on chat type
      let response;
      
      switch(chatType) {
        case "market":
          response = await agentService.getMarketInsights(input);
          break;
        case "negotiation":
          response = await agentService.getNegotiationAdvice(input);
          break;
        default:
          response = await getIntelligentResponse(input);
      }
      
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // If not muted, speak the response
      if (!isMuted) {
        try {
          agentService.setVoice(selectedVoice);
          const audioBuffer = await agentService.generateSpeech(response);
          const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }
        } catch (error) {
          console.error("Error generating speech:", error);
          toast({
            title: "Speech Error",
            description: "Could not generate speech. Check your API key and try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get response from the agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getIntelligentResponse = async (userInput: string): Promise<string> => {
    // First, check if the knowledge base has a relevant response
    const knowledgeResponse = knowledgeBaseService.findResponseForQuery(userInput);
    
    if (knowledgeResponse) {
      return knowledgeResponse;
    }
    
    // Fall back to the agent service
    return agentService.sendMessage(userInput);
  };
  
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const startListening = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Handle audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // In a real implementation, this would send the audio to a speech-to-text service
        // For now, we'll just show a toast
        toast({
          title: "Voice Input",
          description: "Voice input processing would be implemented here",
        });
        
        setIsListening(false);
      };
      
      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      
      toast({
        title: "Voice Input Activated",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone",
        variant: "destructive",
      });
    }
  };
  
  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks of the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    setIsListening(false);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // If currently playing, stop it
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
    
    toast({
      title: isMuted ? "Audio Enabled" : "Audio Disabled",
      description: isMuted ? "Agent responses will now be spoken" : "Agent responses will be text only",
    });
  };
  
  const handleApiKeyClose = () => {
    setShowApiKeyInput(false);
    loadVoices(); // Try to load voices after API key is set
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    agentService.setVoice(voiceId);
    
    toast({
      title: "Voice Changed",
      description: "The agent will now use a different voice",
    });
  };
  
  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-800">
      <ChatHeader 
        selectedVoice={selectedVoice}
        availableVoices={availableVoices}
        isMuted={isMuted}
        onVoiceChange={handleVoiceChange}
        onMuteToggle={toggleMute}
      />
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <LoadingIndicator />}
        </div>
      </ScrollArea>
      
      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={isLoading}
        isListening={isListening}
        isMuted={isMuted}
        toggleListening={toggleListening}
        toggleMute={toggleMute}
      />
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={handleApiKeyClose} />
      )}
    </div>
  );
};
