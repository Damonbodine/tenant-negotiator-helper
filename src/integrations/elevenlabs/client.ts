
// Client for ElevenLabs API
import { voiceClient } from '@/utils/voiceClient';

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export async function speak(text: string): Promise<void> {
  try {
    const audioBuffer = await voiceClient.generateSpeech(text);
    const source = audioContext.createBufferSource();
    audioContext.decodeAudioData(audioBuffer, (buffer) => {
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    });
    return;
  } catch (error) {
    console.error("Error speaking:", error);
    throw error;
  }
}

export async function handleListingAnalysis(userMessage: any, agentMessage: any, setMessages: any) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  
  if (urlRegex.test(userMessage.text)) {
    try {
      const resp = await fetch("/api/listing-analyzer", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: userMessage.text })
      });
      
      const analysis = await resp.json();
      setMessages(prev => [...prev, { ...agentMessage, text: analysis.summary }]);
    } catch (error) {
      console.error("Error analyzing listing:", error);
      setMessages(prev => [...prev, { 
        ...agentMessage, 
        text: "Sorry, I couldn't analyze that listing. Please try again or provide a different URL." 
      }]);
    }
    return true;
  }
  
  return false;
}
