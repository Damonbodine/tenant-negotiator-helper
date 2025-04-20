
import { getApiKey, hasApiKey, saveApiKey } from '@/shared/utils/keyManager';
import { VoiceService } from '@/shared/types';

export class VoiceClient implements VoiceService {
  private baseUrl: string = "https://api.elevenlabs.io/v1";
  private voiceId: string = "21m00Tcm4TlvDq8ikWAM"; // Default voice - Rachel
  
  async setApiKey(key: string): Promise<void> {
    await saveApiKey('ELEVEN_LABS', key);
  }
  
  async hasApiKey(): Promise<boolean> {
    return await hasApiKey('ELEVEN_LABS');
  }
  
  async getApiKey(): Promise<string | null> {
    return await getApiKey('ELEVEN_LABS');
  }
  
  setVoice(voiceId: string): void {
    this.voiceId = voiceId;
  }

  async generateSpeech(text: string): Promise<ArrayBuffer> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("API key not set");
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`ElevenLabs API error: ${errorData.detail}`);
      }
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }

  async getVoices(): Promise<any[]> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("API key not set");
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`ElevenLabs API error: ${errorData.detail}`);
      }
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error("Error getting voices:", error);
      throw error;
    }
  }
}

// Export a properly typed instance of VoiceClient
export const voiceClient: VoiceService = new VoiceClient();
