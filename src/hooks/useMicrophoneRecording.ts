
import { useState, useRef } from "react";
import { useToast } from "./use-toast";

export function useMicrophoneRecording() {
  const [isListening, setIsListening] = useState(false);
  const [microphoneAccessState, setMicrophoneAccessState] = useState<'granted' | 'denied' | 'prompt' | 'error' | null>(null);
  const [recordingTimeoutId, setRecordingTimeoutId] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

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
    } catch (error) {
      handleMicrophoneError(error);
    }
  };

  const stopListening = () => {
    if (recordingTimeoutId) {
      window.clearTimeout(recordingTimeoutId);
      setRecordingTimeoutId(null);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        
        if (mediaRecorderRef.current.stream) {
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

  const handleMicrophoneError = (error: any) => {
    console.error("Error accessing microphone:", error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
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
        description: "Could not access your microphone: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  return {
    isListening,
    microphoneAccessState,
    audioChunksRef,
    checkMicrophonePermission,
    startListening,
    stopListening
  };
}
