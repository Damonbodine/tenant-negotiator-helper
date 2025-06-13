import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeVoicePracticeProps {
  scenario?: string;
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
}

interface AudioState {
  isMuted: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  volume: number;
}

export function RealtimeVoicePractice({ scenario }: RealtimeVoicePracticeProps) {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'disconnected' });
  const [audioState, setAudioState] = useState<AudioState>({
    isMuted: false,
    isRecording: false,
    isPlaying: false,
    volume: 0.8
  });
  const [conversationActive, setConversationActive] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // WebSocket and audio refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio context and get user media
  const initializeAudio = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        }
      });
      
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      // Load audio worklet for processing
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      
      // Create worklet node
      const audioWorklet = new AudioWorkletNode(audioContext, 'realtime-audio-processor');
      audioWorkletRef.current = audioWorklet;
      
      // Connect audio input to worklet
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(audioWorklet);
      
      // Handle audio data from worklet
      audioWorklet.port.onmessage = (event) => {
        if (event.data.type === 'audio' && wsRef.current?.readyState === WebSocket.OPEN) {
          // Convert ArrayBuffer to base64 and send to OpenAI
          const audioData = new Uint8Array(event.data.data);
          const base64Audio = btoa(String.fromCharCode(...audioData));
          
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };
      
      setAudioState(prev => ({ ...prev, isRecording: true }));
      console.log('Audio initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setConnectionState({ status: 'error', error: 'Microphone access denied' });
      return false;
    }
  }, []);

  // Get user context for personalized conversation
  const getUserContext = useCallback(async () => {
    if (!user?.id) return {};

    try {
      // Get user memory context from your existing system
      const { data: context, error } = await supabase.rpc('get_user_ai_context' as any, {
        p_user_id: user.id
      });
      
      if (error) {
        console.warn('Could not get user context:', error.message);
        // Return empty context if the function doesn't exist or fails
        return {};
      }
      
      return context ? context[0] || {} : {};
    } catch (error) {
      console.warn('Failed to get user context:', error);
      return {};
    }
  }, [user?.id]);

  // Connect to OpenAI Realtime API
  const connectToRealtimeAPI = useCallback(async () => {
    if (connectionState.status === 'connecting' || connectionState.status === 'connected') {
      return;
    }

    setConnectionState({ status: 'connecting' });

    try {
      // Initialize audio first
      const audioInitialized = await initializeAudio();
      if (!audioInitialized) return;

      // Get user context for personalization
      const userContext = await getUserContext();

      // TEMPORARY: Using API key directly until we figure out ephemeral token support
      // TODO: This is NOT secure for production - need to implement proper auth
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        // Try to get from server if not in env
        console.log('No API key in environment, trying server endpoint...');
        const sessionResponse = await supabase.functions.invoke('openai-realtime-session', {
          method: 'POST'
        });

        if (sessionResponse.error) {
          throw new Error(sessionResponse.error.message || 'Failed to create session');
        }

        const sessionData = sessionResponse.data;
        console.log('Session response:', sessionData);
        
        // For now, we'll need to return the API key from the server
        // This is temporary until OpenAI supports ephemeral tokens for Realtime API
        throw new Error('OpenAI Realtime API requires API key - please configure VITE_OPENAI_API_KEY');
      }

      console.log('Connecting to OpenAI Realtime API...');
      console.warn('WARNING: Using API key directly in browser - this is NOT secure for production!');
      console.log('API Key format check:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));

      // First test if we can reach OpenAI API at all
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        console.log('OpenAI API test response:', testResponse.status);
        if (!testResponse.ok) {
          throw new Error(`API key validation failed: ${testResponse.status}`);
        }

        // Also test if Realtime API is accessible (though this might not work via fetch)
        try {
          const realtimeTest = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'realtime=v1'
            },
            body: JSON.stringify({
              model: 'gpt-4o-realtime-preview-2024-12-17',
              voice: 'alloy'
            })
          });
          console.log('Realtime API test response:', realtimeTest.status);
          if (realtimeTest.ok) {
            const sessionData = await realtimeTest.json();
            console.log('Realtime session data:', sessionData);
            console.log('Session ID:', sessionData.id);
            console.log('Client secret available:', !!sessionData.client_secret);
          }
        } catch (realtimeError) {
          console.warn('Realtime API test failed (might be expected):', realtimeError);
        }
      } catch (error) {
        console.error('OpenAI API test failed:', error);
        setConnectionState({ status: 'error', error: 'API key validation failed' });
        return;
      }

      // Create WebSocket connection using API key
      // According to OpenAI docs, we use the subprotocol format for browser connections
      // The correct format is to include the API key as a subprotocol
      console.log('Creating WebSocket with validated API key...');
      
      // Try alternative connection methods
      console.log('Attempting WebSocket connection...');
      
      // Method 1: Try with Authorization in URL (not recommended but might work)
      let ws;
      try {
        ws = new WebSocket(
          `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17&authorization=Bearer%20${encodeURIComponent(apiKey)}`
        );
      } catch (error) {
        console.log('Method 1 failed, trying method 2...');
        // Method 2: Use the documented subprotocol approach
        try {
          ws = new WebSocket(
            'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
            `openai-insecure-api-key.${apiKey}`
          );
        } catch (error2) {
          console.log('Method 2 failed, trying method 3...');
          // Method 3: Simple connection and authenticate via message
          ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17');
        }
      }

      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        setConnectionState({ status: 'connected' });
        
        // Don't send authentication message - WebSocket subprotocol handles auth
        console.log('WebSocket protocol:', ws.protocol);
        console.log('Sending session configuration...');
        
        // Send initial configuration directly
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are the Renter's Coach AI assistant for voice practice sessions. 

SYSTEM PROMPT: The Renter's Coach (Real-Time Voice Agent)

Hi, thanks for coming by today. How can I help you on your apartment journey?

Just so you know, I'm here to give you smart, data-backed rental advice—but I'm not a lawyer or a broker. Think of me like your renter sidekick.

## USER CONTEXT
${Object.keys(userContext).length > 0 ? `User Context: ${JSON.stringify(userContext)}` : 'No specific user context available'}

## SCENARIO
${scenario ? `Practice Scenario: ${scenario}` : 'General rental negotiation coaching'}

## VOICE CONVERSATION GUIDELINES
- Keep responses conversational and natural (you're speaking, not writing)
- Use their rental history and preferences to personalize advice
- You are their coach and advocate, helping them practice negotiation skills
- Ask follow-up questions to keep the conversation flowing
- Provide specific, actionable advice based on their situation
- Be encouraging and supportive while being realistic about market conditions

Begin by greeting them as their rental coach and asking what specific situation they'd like to practice.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        };
        
        ws.send(JSON.stringify(sessionConfig));
        
        // Start audio recording
        if (audioWorkletRef.current) {
          audioWorkletRef.current.port.postMessage({ type: 'start' });
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type);
        
        switch (message.type) {
          case 'session.created':
            console.log('Session created');
            setConversationActive(true);
            break;
          case 'session.updated':
            console.log('Session updated');
            break;
          case 'response.audio.delta':
            // Handle incoming audio chunks
            playAudioChunk(message.delta);
            break;
          case 'response.audio.done':
            console.log('Audio response complete');
            break;
          case 'conversation.item.input_audio_transcription.completed':
            console.log('User said:', message.transcript);
            break;
          case 'error':
            console.error('Realtime API error:', message.error);
            console.error('Full error message:', JSON.stringify(message, null, 2));
            setConnectionState({ status: 'error', error: message.error?.message || 'Unknown error' });
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket readyState:', ws.readyState);
        console.error('WebSocket URL:', ws.url);
        console.error('WebSocket protocol:', ws.protocol);
        setConnectionState({ status: 'error', error: 'WebSocket connection failed' });
      };

      ws.onclose = () => {
        console.log('Disconnected from OpenAI Realtime API');
        setConnectionState({ status: 'disconnected' });
        setConversationActive(false);
        cleanup();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to Realtime API:', error);
      setConnectionState({ status: 'error', error: 'Failed to connect' });
    }
  }, [connectionState.status, initializeAudio, getUserContext, scenario]);

  // Play audio chunk received from API
  const playAudioChunk = useCallback((audioData: string) => {
    if (!audioContextRef.current) return;
    
    try {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      
      // Decode base64 audio data to PCM16
      const binaryString = atob(audioData);
      const pcm16Data = new Int16Array(binaryString.length / 2);
      
      for (let i = 0; i < pcm16Data.length; i++) {
        const byte1 = binaryString.charCodeAt(i * 2);
        const byte2 = binaryString.charCodeAt(i * 2 + 1);
        pcm16Data[i] = (byte2 << 8) | byte1; // Little-endian
      }
      
      // Convert PCM16 to Float32 for Web Audio API
      const audioContext = audioContextRef.current;
      const audioBuffer = audioContext.createBuffer(1, pcm16Data.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16Data.length; i++) {
        channelData[i] = pcm16Data[i] / 32768.0; // Convert to float [-1, 1]
      }
      
      // Play the audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      };
      source.start();
        
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  // Disconnect from API
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    cleanup();
  }, []);

  // Cleanup audio resources
  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (audioWorkletRef.current) {
      audioWorkletRef.current.disconnect();
      audioWorkletRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-start conversation (disabled for now to prevent reconnection loop)
  useEffect(() => {
    // Commented out to stop reconnection loop while debugging
    // if (connectionState.status === 'disconnected') {
    //   const timer = setTimeout(() => {
    //     connectToRealtimeAPI();
    //   }, 1000);
    //   
    //   return () => clearTimeout(timer);
    // }
  }, [connectionState.status, connectToRealtimeAPI]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Real-time Voice Practice
          {user && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                OpenAI Realtime
              </Badge>
              {conversationActive && (
                <Badge variant="outline" className="text-xs">
                  Live Conversation
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Natural conversation with AI using OpenAI's Realtime API - interrupt anytime, just like a real conversation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionState.status === 'connected' ? 'bg-green-500' : 
            connectionState.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            connectionState.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm text-muted-foreground">
            {connectionState.status === 'connected' ? 'Connected - Ready to chat' :
             connectionState.status === 'connecting' ? 'Connecting...' :
             connectionState.status === 'error' ? connectionState.error :
             'Disconnected'}
          </span>
        </div>

        {/* Connection Controls */}
        <div className="flex gap-2">
          {connectionState.status === 'disconnected' || connectionState.status === 'error' ? (
            <Button 
              onClick={connectToRealtimeAPI} 
              disabled={connectionState.status === 'connecting'}
            >
              <Phone className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          ) : connectionState.status === 'connecting' ? (
            <Button disabled>
              <Phone className="h-4 w-4 mr-2" />
              Connecting...
            </Button>
          ) : (
            <Button onClick={disconnect} variant="destructive">
              <PhoneOff className="h-4 w-4 mr-2" />
              End Conversation
            </Button>
          )}
        </div>

        {/* Audio Controls */}
        {conversationActive && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant={audioState.isRecording ? "default" : "secondary"} className="animate-pulse">
              🎤 {audioState.isRecording ? 'Recording' : 'Ready to listen'}
            </Badge>
            {audioState.isPlaying && (
              <Badge variant="secondary">
                🔊 AI Speaking
              </Badge>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>How it works:</strong></p>
          <p>• Just start talking - no need to click anything!</p>
          <p>• You can interrupt the AI anytime - it's a real conversation</p>
          <p>• The AI knows your rental history and will personalize advice</p>
          <p>• Practice any negotiation scenario you want</p>
        </div>

        {/* Error Display */}
        {connectionState.status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{connectionState.error}</p>
            <Button 
              onClick={connectToRealtimeAPI} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}