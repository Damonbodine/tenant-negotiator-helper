import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { agentService } from "@/utils/agentService";
import { chatService } from "@/utils/chatService";
import { useToast } from "@/hooks/use-toast";

export type MessageType = "user" | "agent";

export interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

export function useVoiceNegotiation(scenario: string) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM"); // Rachel voice
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [hasBackendApiKey, setHasBackendApiKey] = useState(false);
  const [microphoneAccessState, setMicrophoneAccessState] = useState<'granted' | 'denied' | 'prompt' | 'error' | null>(null);
  const [recordingTimeoutId, setRecordingTimeoutId] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    const checkBackendApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-elevenlabs-key');
        if (!error && data?.hasKey) {
          setHasBackendApiKey(true);
          console.log("Backend ElevenLabs API key is configured");
        } else {
          console.log("Backend ElevenLabs API key is not configured or error occurred:", error?.message);
          setHasBackendApiKey(false);
        }
      } catch (error) {
        console.error("Error checking backend API key:", error);
        setHasBackendApiKey(false);
      }
    };
    
    checkBackendApiKey();
  }, []);
  
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        if (navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          setMicrophoneAccessState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
          
          permissionStatus.onchange = () => {
            setMicrophoneAccessState(permissionStatus.state as 'granted' | 'denied' | 'prompt');
            
            if (permissionStatus.state === 'granted') {
              toast({
                title: "Microphone Access Granted",
                description: "You can now use your microphone for voice input.",
              });
            } else if (permissionStatus.state === 'denied') {
              toast({
                title: "Microphone Access Denied",
                description: "Please enable microphone access in your browser settings to use voice features.",
                variant: "destructive",
              });
              
              if (isListening) {
                stopListening();
              }
            }
          };
        } else {
          console.log("Browser doesn't support permissions API, will check on first use");
          setMicrophoneAccessState('prompt');
        }
      } catch (error) {
        console.error("Error checking microphone permissions:", error);
        setMicrophoneAccessState('error');
      }
    };
    
    checkMicrophonePermission();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (recordingTimeoutId) {
        window.clearTimeout(recordingTimeoutId);
      }
    };
  }, []);
  
  useEffect(() => {
    audioRef.current = new Audio();
    
    if (messages.length === 0 && isCallActive) {
      startNegotiationPractice();
    }
  }, [messages.length, isCallActive, scenario, isMuted]);
  
  const loadVoices = async () => {
    try {
      if (hasBackendApiKey) {
        const { data, error } = await supabase.functions.invoke('get-elevenlabs-voices');
        if (error) {
          console.error("Error invoking get-elevenlabs-voices:", error);
          throw error;
        }
        setAvailableVoices(data?.voices || []);
      } else {
        const voices = await agentService.getVoices();
        setAvailableVoices(voices);
      }
      console.log("Available voices loaded");
    } catch (error) {
      console.error("Error loading voices:", error);
    }
  };
  
  const speakText = async (text: string) => {
    try {
      let audioBuffer;
      
      if (hasBackendApiKey) {
        const { data, error } = await supabase.functions.invoke('generate-speech', {
          body: { text, voiceId: selectedVoice }
        });
        
        if (error) {
          console.error("Error invoking generate-speech:", error);
          throw error;
        }
        
        if (!data || !data.audioContent) {
          console.error("No audio content returned from generate-speech function");
          throw new Error("Failed to generate speech: No audio content returned");
        }
        
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBuffer = bytes.buffer;
      } else {
        agentService.setVoice(selectedVoice);
        audioBuffer = await agentService.generateSpeech(text);
      }
      
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        console.log("Playing audio");
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
          });
        }
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      toast({
        title: "Speech Error",
        description: `Could not generate speech: ${(error as Error).message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };
  
  const startNegotiationPractice = async () => {
    try {
      const systemPrompt = await chatService.getPracticeNegotiationPrompt(scenario);
      
      let welcomeMessage = "Hello! I'm the landlord for the property you're interested in. What aspects of the lease would you like to discuss today?";
      
      if (scenario === "random") {
        welcomeMessage = "Hello! I'm the property manager for the unit you inquired about. I see you're interested in discussing some details about the lease. What specific aspects would you like to negotiate today?";
      }
      
      const initialMessage: Message = {
        id: "welcome",
        type: "agent",
        text: welcomeMessage,
        timestamp: new Date()
      };
      
      setMessages([initialMessage]);
      
      if (!isMuted) {
        speakText(initialMessage.text);
      }
    } catch (error) {
      console.error("Error starting negotiation practice:", error);
      toast({
        title: "Error",
        description: "Failed to start the negotiation practice",
        variant: "destructive",
      });
    }
  };
  
  const startCall = async () => {
    if (!hasBackendApiKey && !(await agentService.hasApiKey())) {
      setShowApiKeyInput(true);
      return;
    }
    
    try {
      if (!hasBackendApiKey) {
        await agentService.startConversation();
      }
      
      setIsCallActive(true);
      loadVoices();
      
      toast({
        title: "Call Started",
        description: "You're now connected with the landlord agent.",
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Error",
        description: "Failed to start the call. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const endCall = () => {
    setIsCallActive(false);
    setMessages([]);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (isListening) {
      stopListening();
    }
    
    toast({
      title: "Call Ended",
      description: "Your practice session has ended.",
    });
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
      const systemPrompt = await chatService.getPracticeNegotiationPrompt(scenario);
      
      const history = messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      console.log("Sending message to Gemini:", input);
      console.log("With history:", JSON.stringify(history, null, 2));
      
      const response = await chatService.sendMessageToGemini(input, history);
      
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      if (!isMuted) {
        speakText(response);
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
  
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const startListening = async () => {
    try {
      toast({
        title: "Requesting Microphone Access",
        description: "Please allow microphone access when prompted by your browser.",
      });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      setMicrophoneAccessState('granted');
      
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.log('MediaRecorder with specified options failed, trying without options');
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstart = () => {
        console.log("MediaRecorder started");
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Microphone Error",
          description: "An error occurred while using your microphone. Please try again.",
          variant: "destructive",
        });
        stopListening();
      };
      
      mediaRecorder.onstop = async () => {
        console.log("MediaRecorder stopped, processing audio chunks");
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`Audio blob created with size: ${audioBlob.size} bytes`);
        
        try {
          toast({
            title: "Voice Input",
            description: "Processing your voice input...",
          });
          
          const placeholderTexts = {
            'standard': "I think $1,800 is a bit high for this area. Would you consider $1,700 per month?",
            'luxury': "I'm definitely interested in the premium amenities, but I'd like to discuss the possibility of including the utilities in the rent.",
            'house': "I love the house and location. I'm willing to sign a longer lease if you can offer a small discount on the monthly rent."
          };
          
          setInput(placeholderTexts[scenario as keyof typeof placeholderTexts] || "I'd like to discuss the rent amount. Is there any flexibility?");
          
          setTimeout(() => {
            handleSend();
          }, 500);
        } catch (error) {
          console.error("Error processing audio:", error);
          toast({
            title: "Voice Processing Error",
            description: "Could not process your voice input: " + ((error as Error).message || "Unknown error"),
            variant: "destructive",
          });
        }
        
        setIsListening(false);
      };
      
      try {
        console.log("Starting MediaRecorder with timeSlice of 1000ms");
        mediaRecorder.start(1000);
        setIsListening(true);
        
        toast({
          title: "Voice Input Activated",
          description: "Speak clearly into your microphone",
        });
        
        const timeoutId = window.setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log("Automatically stopping recording after 5 seconds");
            stopListening();
          }
        }, 5000);
        
        setRecordingTimeoutId(timeoutId);
      } catch (e) {
        console.error("Error starting MediaRecorder:", e);
        toast({
          title: "Microphone Error",
          description: "Could not start recording: " + ((e as Error).message || "Unknown error"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      
      if ((error as Error).name === 'NotAllowedError' || (error as Error).name === 'PermissionDeniedError') {
        setMicrophoneAccessState('denied');
        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access in your browser settings to use voice features.",
          variant: "destructive",
        });
      } else {
        setMicrophoneAccessState('error');
        toast({
          title: "Microphone Error",
          description: "Could not access your microphone: " + ((error as Error).message || "Unknown error"),
          variant: "destructive",
        });
      }
    }
  };
  
  const stopListening = () => {
    console.log("Stopping MediaRecorder");
    
    if (recordingTimeoutId) {
      window.clearTimeout(recordingTimeoutId);
      setRecordingTimeoutId(null);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        
        if (mediaRecorderRef.current.stream) {
          console.log("Stopping all media tracks");
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    }
    
    toast({
      title: isMuted ? "Audio Enabled" : "Audio Disabled",
      description: isMuted ? "Agent responses will now be spoken" : "Agent responses will be text only",
    });
  };
  
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    if (!hasBackendApiKey) {
      agentService.setVoice(voiceId);
    }
    
    toast({
      title: "Voice Changed",
      description: "The landlord will now use a different voice",
    });
  };

  return {
    messages,
    input,
    setInput,
    isListening,
    isCallActive,
    showApiKeyInput,
    setShowApiKeyInput,
    isLoading,
    isMuted,
    selectedVoice,
    availableVoices,
    hasBackendApiKey,
    microphoneAccessState,
    startCall,
    endCall,
    handleSend,
    toggleListening,
    toggleMute,
    handleVoiceChange
  };
}
