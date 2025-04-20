
import axios from 'axios';
import { voiceClient } from '@/shared/services/voiceClient';

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Default voice - Rachel
const ENDPOINT = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;

export async function speak(text: string): Promise<void> {
  try {
    const apiKey = await voiceClient.getApiKey();
    if (!apiKey || !text) {
      console.error('Missing API key or text');
      return;
    }

    const { data } = await axios.post(
      ENDPOINT,
      { 
        text, 
        model_id: "eleven_multilingual_v2"
      },
      { 
        responseType: "arraybuffer", 
        headers: { 
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        } 
      }
    );

    const audioBlob = new Blob([data], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
    
    // Clean up the URL after playing
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}
