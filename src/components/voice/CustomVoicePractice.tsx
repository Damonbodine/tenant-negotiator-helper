import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { chatClient } from '@/shared/services/chatClient';
import { ChatMessage } from '@/shared/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CustomVoicePracticeProps {
  scenario?: string;
}

export function CustomVoicePractice({ scenario }: CustomVoicePracticeProps) {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 0.8,
    voice: null as SpeechSynthesisVoice | null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech synthesis and recognition
  useEffect(() => {
    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Check for speech synthesis support
    if (!('speechSynthesis' in window)) {
      setError('Speech synthesis not supported in this browser');
      return;
    }

    speechSynthRef.current = window.speechSynthesis;

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setCurrentTranscript(interimTranscript || finalTranscript);
      
      if (finalTranscript.trim()) {
        handleUserSpeech(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setCurrentTranscript('');
    };

    recognitionRef.current = recognition;

    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthRef.current?.getVoices() || [];
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Karen') || 
        voice.name.includes('Female')
      ) || voices[0];
      
      setVoiceSettings(prev => ({ ...prev, voice: preferredVoice }));
    };

    // Load voices immediately and on voiceschanged event
    loadVoices();
    speechSynthRef.current?.addEventListener('voiceschanged', loadVoices);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      speechSynthRef.current?.cancel();
    };
  }, []);

  // Auto-start the session when component mounts
  useEffect(() => {
    if (!sessionActive && !error) {
      // Auto-start the practice session with a slight delay to ensure everything is initialized
      const timer = setTimeout(() => {
        startSession();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [sessionActive, error]); // Only run when session is not active and no errors

  // Auto-save conversation when component unmounts or scenario changes
  useEffect(() => {
    return () => {
      // Mark conversation as completed when component unmounts
      if (user?.id && conversationIdRef.current && typeof conversationIdRef.current === 'string' && sessionActive && conversation.length > 0) {
        // Generate summary before auto-saving
        generateConversationSummary().then(() => {
          (supabase as any)
            .from('rental_conversations')
            .update({ 
              updated_at: new Date().toISOString(),
              context: { 
                scenario, 
                practiceMode: 'voice', 
                completed: true,
                messageCount: conversation.length,
                autoSaved: true,
                hasSummary: true,
                hasTranscript: true
              }
            })
            .eq('id', conversationIdRef.current)
            .then(({ error }: any) => {
              if (error) {
                console.error('Error auto-saving conversation:', error);
              }
            });
        }).catch(error => {
          console.error('Error auto-generating summary:', error);
          // Still save without summary if generation fails
          (supabase as any)
            .from('rental_conversations')
            .update({ 
              updated_at: new Date().toISOString(),
              context: { 
                scenario, 
                practiceMode: 'voice', 
                completed: true,
                messageCount: conversation.length,
                autoSaved: true
              }
            })
            .eq('id', conversationIdRef.current);
        });
      }
    };
  }, [user?.id, sessionActive, conversation.length, scenario]);

  // Start a new practice session
  const startSession = async () => {
    setSessionActive(true);
    setConversation([]);
    setError(null);
    
    // Create a new conversation in memory if user is authenticated
    if (user?.id) {
      try {
        const conversationTitle = `Voice Practice - ${scenario ? scenario : 'Random Scenario'} - ${new Date().toLocaleDateString()}`;
        const { data: conversationData, error: conversationError } = await (supabase as any)
          .from('rental_conversations')
          .insert({
            user_id: user.id,
            title: conversationTitle,
            conversation_type: 'voice_practice',
            context: { scenario, practiceMode: 'voice' }
          })
          .select('id')
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
        } else {
          conversationIdRef.current = conversationData.id;
        }
      } catch (error) {
        console.error('Error setting up conversation memory:', error);
        // Continue without memory if there's an error
        conversationIdRef.current = `voice-practice-${Date.now()}`;
      }
    } else {
      conversationIdRef.current = `voice-practice-${Date.now()}`;
    }

    // Create AI landlord introduction with memory context
    const introMessage = await generateAIResponse("Start a rental negotiation practice session", [], true);
    if (introMessage) {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'agent',
        text: introMessage,
        timestamp: new Date()
      };
      setConversation([aiMessage]);
      
      // Save AI intro message to memory
      await saveMessageToMemory(aiMessage);
      
      speakText(introMessage);
    }
  };

  // Handle user speech input
  const handleUserSpeech = async (transcript: string) => {
    if (!sessionActive) return;

    // Add user message to conversation
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: transcript,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    
    // Save user message to memory
    await saveMessageToMemory(userMessage);
    
    setIsProcessing(true);

    try {
      // Get AI response with full conversation context and memory
      const aiResponse = await generateAIResponse(transcript, [...conversation, userMessage]);
      
      if (aiResponse) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          text: aiResponse,
          timestamp: new Date()
        };
        
        setConversation(prev => [...prev, aiMessage]);
        
        // Save AI response to memory
        await saveMessageToMemory(aiMessage);
        
        speakText(aiResponse);
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      setError('Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save message to memory database
  const saveMessageToMemory = async (message: ChatMessage): Promise<void> => {
    if (!user?.id || !conversationIdRef.current) return;

    try {
      const { error } = await (supabase as any)
        .from('rental_messages')
        .insert({
          conversation_id: conversationIdRef.current,
          role: message.type === 'user' ? 'user' : 'assistant',
          content: message.text,
          metadata: {
            messageId: message.id,
            timestamp: message.timestamp.toISOString(),
            practiceMode: 'voice',
            scenario: scenario
          }
        });

      if (error) {
        console.error('Error saving message to memory:', error);
      }
    } catch (error) {
      console.error('Error saving message to memory:', error);
    }
  };

  // Generate conversation summary and transcript
  const generateConversationSummary = async (): Promise<void> => {
    if (!user?.id || !conversationIdRef.current || conversation.length === 0) return;

    try {
      // Generate full transcript
      const transcript = conversation.map((msg, index) => {
        const speaker = msg.type === 'user' ? 'Renter' : 'AI Coach';
        const timestamp = msg.timestamp.toLocaleTimeString();
        return `[${timestamp}] ${speaker}: ${msg.text}`;
      }).join('\n\n');

      // Generate AI summary of the conversation
      const summaryPrompt = `Please analyze this voice practice coaching session and provide a structured summary:

CONVERSATION TRANSCRIPT:
${transcript}

SCENARIO: ${scenario || 'General negotiation coaching'}

Please provide:
1. **Session Overview**: Brief description of what was practiced
2. **Key Topics Discussed**: Main areas of coaching
3. **Practice Techniques Used**: What skills the renter worked on
4. **AI Coach Feedback**: Strengths and areas for improvement
5. **Progress Made**: Any breakthroughs or learning moments
6. **Next Steps**: Specific suggestions for continued practice

Keep the summary concise but comprehensive, focusing on the renter's learning journey and skill development.`;

      const summaryResponse = await chatClient.sendMessageToGemini(summaryPrompt, []);

      // Save transcript and summary to database
      const { error: summaryError } = await (supabase as any)
        .from('rental_messages')
        .insert({
          conversation_id: conversationIdRef.current,
          role: 'system',
          content: summaryResponse,
          metadata: {
            messageType: 'summary',
            practiceMode: 'voice',
            scenario: scenario,
            timestamp: new Date().toISOString(),
            messageCount: conversation.length
          }
        });

      const { error: transcriptError } = await (supabase as any)
        .from('rental_messages')
        .insert({
          conversation_id: conversationIdRef.current,
          role: 'system',
          content: transcript,
          metadata: {
            messageType: 'transcript',
            practiceMode: 'voice',
            scenario: scenario,
            timestamp: new Date().toISOString(),
            messageCount: conversation.length
          }
        });

      if (summaryError) {
        console.error('Error saving summary:', summaryError);
      }
      if (transcriptError) {
        console.error('Error saving transcript:', transcriptError);
      }
    } catch (error) {
      console.error('Error generating conversation summary:', error);
    }
  };

  // Generate AI response using your enhanced chat system with memory
  const generateAIResponse = async (message: string, history: ChatMessage[], isIntro = false): Promise<string> => {
    try {
      // Set up voice practice specific prompt template
      chatClient.setActivePromptTemplate('voice-practice');
      
      let enhancedMessage = message;
      
      if (isIntro) {
        enhancedMessage = `You are the Renter's Coach AI assistant. A user just started a voice practice session for rental negotiations. ${scenario ? `They selected the scenario: ${scenario}` : 'They want to practice general negotiation skills.'}

Give them a friendly, supportive greeting and ask what specific rental situation they'd like to practice with. Be encouraging and let them know you're here to help them become a better negotiator.

Context for this session:
- This is a VOICE practice session - keep responses conversational and natural for speaking
- Use the user's rental history and preferences from their memory to make this relevant
- You are their coach and advocate, not a landlord
- Keep responses under 100 words since this will be spoken aloud
- End with a question about what they'd like to practice

Begin by greeting them as their rental coach and asking what situation they'd like to work on.`;
      }

      const response = await chatClient.sendMessageToGemini(enhancedMessage, history);
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  };

  // Speak text using OpenAI TTS with Onyx voice
  const speakText = async (text: string) => {
    try {
      // Stop any current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      setIsSpeaking(true);

      // Call OpenAI TTS edge function
      const { data, error } = await supabase.functions.invoke('openai-tts', {
        body: { 
          text,
          voice: 'onyx',
          model: 'tts-1'
        }
      });

      if (error) {
        console.error('OpenAI TTS error:', error);
        console.log('Falling back to browser TTS due to OpenAI TTS error');
        // Fallback to browser TTS if OpenAI fails
        setIsSpeaking(false);
        fallbackToWebSpeech(text);
        return;
      }

      // Check if we received valid audio data
      if (!data) {
        console.error('No audio data received from OpenAI TTS');
        setIsSpeaking(false);
        fallbackToWebSpeech(text);
        return;
      }

      // Handle different data formats
      let audioBlob: Blob;
      
      try {
        // Check if response is the new JSON format
        if (data.audio && data.format === 'base64') {
          // Decode base64 audio data
          const binaryString = atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBlob = new Blob([bytes], { type: data.contentType || 'audio/mpeg' });
        } else if (data instanceof ArrayBuffer) {
          // Direct ArrayBuffer response (for backward compatibility)
          audioBlob = new Blob([data], { type: 'audio/mpeg' });
        } else if (typeof data === 'string') {
          // Legacy string response - fallback to browser TTS
          console.warn('Received legacy string response from TTS, using fallback');
          setIsSpeaking(false);
          fallbackToWebSpeech(text);
          return;
        } else {
          console.error('Unsupported audio data format:', typeof data);
          setIsSpeaking(false);
          fallbackToWebSpeech(text);
          return;
        }
      } catch (error) {
        console.error('Error processing audio data:', error);
        console.log('Falling back to browser TTS due to audio processing error');
        setIsSpeaking(false);
        fallbackToWebSpeech(text);
        return;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      currentAudioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      audio.onerror = (event) => {
        console.error('Audio playback error:', event);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        // Fallback to browser TTS on audio playback error
        fallbackToWebSpeech(text);
      };

      await audio.play();
    } catch (error) {
      console.error('Error with OpenAI TTS:', error);
      console.log('Falling back to browser TTS due to network/API error');
      setIsSpeaking(false);
      // Fallback to browser TTS on any error
      fallbackToWebSpeech(text);
    }
  };

  // Fallback to browser TTS if OpenAI TTS fails
  const fallbackToWebSpeech = (text: string) => {
    if (!speechSynthRef.current || !voiceSettings.voice) {
      setIsSpeaking(false);
      return;
    }

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceSettings.voice;
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    speechSynthRef.current.speak(utterance);
  };

  // Start/stop listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else if (sessionActive && !isSpeaking && !isProcessing) {
      recognitionRef.current?.start();
    }
  };

  // Stop current speech
  const stopSpeaking = () => {
    // Stop OpenAI TTS audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Stop browser TTS if playing
    speechSynthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // Reset session
  const resetSession = async () => {
    // Generate summary and transcript before resetting
    if (user?.id && conversationIdRef.current && typeof conversationIdRef.current === 'string' && conversation.length > 0) {
      try {
        await generateConversationSummary();
        
        await (supabase as any)
          .from('rental_conversations')
          .update({ 
            updated_at: new Date().toISOString(),
            context: { 
              scenario, 
              practiceMode: 'voice', 
              completed: true,
              messageCount: conversation.length,
              hasSummary: true,
              hasTranscript: true
            }
          })
          .eq('id', conversationIdRef.current);
      } catch (error) {
        console.error('Error updating conversation completion:', error);
      }
    }

    setSessionActive(false);
    setConversation([]);
    setCurrentTranscript('');
    setError(null);
    recognitionRef.current?.stop();
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    speechSynthRef.current?.cancel();
    
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessing(false);
    conversationIdRef.current = null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Custom Voice Practice
          {user && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Memory Enabled
              </Badge>
              {sessionActive && conversationIdRef.current && (
                <Badge variant="outline" className="text-xs">
                  Saving to History
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Practice rental negotiations with AI using high-quality OpenAI Onyx voice (with browser fallback)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Session Controls */}
        <div className="flex gap-2">
          {!sessionActive ? (
            <Button onClick={startSession} disabled={!!error}>
              <Play className="h-4 w-4 mr-2" />
              Start Practice
            </Button>
          ) : (
            <>
              <Button 
                onClick={toggleListening} 
                disabled={isSpeaking || isProcessing}
                variant={isListening ? "destructive" : "default"}
                className={isListening ? "animate-pulse" : ""}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Speaking
                  </>
                )}
              </Button>
              
              {isSpeaking && (
                <Button onClick={stopSpeaking} variant="outline">
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop AI Speech
                </Button>
              )}
              
              <Button onClick={resetSession} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Status Indicators */}
        {sessionActive && (
          <div className="flex gap-2 flex-wrap">
            {isListening && (
              <Badge variant="default" className="animate-pulse">
                🎤 Listening...
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="secondary">
                🔊 AI Speaking
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline">
                ⏳ Processing...
              </Badge>
            )}
          </div>
        )}

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">You're saying:</p>
            <p className="text-sm">{currentTranscript}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {conversation.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-50 border-l-4 border-blue-500 ml-4'
                    : 'bg-green-50 border-l-4 border-green-500 mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {message.type === 'user' ? 'You' : 'AI Coach'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.text}</p>
                {message.type === 'agent' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakText(message.text)}
                    className="mt-2 h-6 text-xs"
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Replay
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click "Start Practice" to begin a negotiation session</p>
          <p>• Click "Start Speaking" when ready to respond</p>
          <p>• The AI will use your rental history for personalized practice</p>
          <p>• Works best in Chrome, Safari, and Edge browsers</p>
        </div>
      </CardContent>
    </Card>
  );
}