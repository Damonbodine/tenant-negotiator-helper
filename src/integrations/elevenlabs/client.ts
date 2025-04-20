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

export async function handleListingAnalysis(userMessage: any, agentMessage: any, setMessages: any): Promise<boolean> {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  
  if (urlRegex.test(userMessage.text)) {
    try {
      // First update the message to show we're analyzing
      setMessages(prev => [...prev, { 
        ...agentMessage, 
        text: "I'm analyzing that listing for you. This may take a moment..." 
      }]);
      
      const resp = await fetch("/api/listing-analyzer", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: userMessage.text })
      });
      
      if (!resp.ok) {
        // If the API returns an error, we'll show a more helpful message
        const errorData = await resp.json();
        console.error("Listing analyzer API error:", errorData);
        
        setMessages(prev => {
          // Replace the "analyzing" message with the error message
          const messages = [...prev];
          messages[messages.length - 1] = { 
            ...agentMessage, 
            text: "I couldn't analyze that listing right now. Let me help you manually instead. Could you tell me more about the property, like the address, price, square footage, and number of bedrooms?" 
          };
          return messages;
        });
        
        return true;
      }
      
      const analysis = await resp.json();
      
      // Update the message with the analysis result
      setMessages(prev => {
        // Replace the "analyzing" message with the analysis result
        const messages = [...prev];
        messages[messages.length - 1] = { 
          ...agentMessage, 
          text: analysis.summary + "\n\n**[Want to practice negotiating for this property? [Click here to try our negotiation simulator](/practice/voice)]**" 
        };
        return messages;
      });
      
      return true;
    } catch (error) {
      console.error("Error analyzing listing:", error);
      
      // Show a more helpful error message
      setMessages(prev => {
        // If we were in the middle of analyzing, replace that message
        if (prev[prev.length - 1].text.includes("analyzing")) {
          const messages = [...prev];
          messages[messages.length - 1] = { 
            ...agentMessage, 
            text: "I'm having trouble analyzing that listing right now. Instead, could you tell me more details about the property you're interested in? Things like location, price, square footage, and number of bedrooms would be helpful." 
          };
          return messages;
        } else {
          // Otherwise add a new message
          return [...prev, { 
            ...agentMessage, 
            text: "I'm having trouble analyzing that listing right now. Instead, could you tell me more details about the property you're interested in? Things like location, price, square footage, and number of bedrooms would be helpful." 
          }];
        }
      });
      
      return true;
    }
  }
  
  return false;
}
