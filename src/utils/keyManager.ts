
/**
 * Key Manager utility for securely handling API keys
 * Uses Supabase for secure storage instead of localStorage
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface ApiKeyConfig {
  name: string;
  storageKey: string;
  isRequired: boolean;
  url: string;
}

// API key configurations
export const API_KEYS: Record<string, ApiKeyConfig> = {
  ELEVEN_LABS: {
    name: "ElevenLabs API Key",
    storageKey: "elevenlabs_api_key",
    isRequired: true,
    url: "https://elevenlabs.io/app/api"
  },
  GOOGLE: {
    name: "Google API Key",
    storageKey: "google_api_key",
    isRequired: false,
    url: "https://console.cloud.google.com/apis/credentials"
  }
  // Add additional API keys here as needed
};

/**
 * Get an API key from Supabase
 */
export const getApiKey = async (keyType: string): Promise<string | null> => {
  const config = API_KEYS[keyType];
  if (!config) return null;
  
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('key_name', config.storageKey)
      .single();
    
    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
    
    return data?.key_value || null;
  } catch (error) {
    console.error('Error accessing Supabase:', error);
    
    // Fallback to localStorage if Supabase is not available
    const legacyKey = localStorage.getItem(config.storageKey);
    if (legacyKey) {
      // Simple XOR decryption (from previous implementation)
      const ENCRYPTION_KEY = "rentcoach-app-encryption";
      return Array.from(legacyKey)
        .map(char => 
          String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0))
        )
        .join('');
    }
    
    return null;
  }
};

/**
 * Save an API key to Supabase
 */
export const saveApiKey = async (keyType: string, value: string): Promise<void> => {
  const config = API_KEYS[keyType];
  if (!config) return;
  
  try {
    // First check if the key already exists
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_name', config.storageKey)
      .single();
    
    if (existingKey) {
      // Update existing key
      const { error } = await supabase
        .from('api_keys')
        .update({ key_value: value })
        .eq('key_name', config.storageKey);
      
      if (error) throw error;
    } else {
      // Insert new key
      const { error } = await supabase
        .from('api_keys')
        .insert({ key_name: config.storageKey, key_value: value });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving API key to Supabase:', error);
    toast({
      title: "Warning",
      description: "Unable to save API key securely. Using temporary storage instead.",
      variant: "destructive",
    });
    
    // Fallback to localStorage if Supabase is not available
    // Simple XOR encryption (from previous implementation)
    const ENCRYPTION_KEY = "rentcoach-app-encryption";
    const encryptedValue = Array.from(value)
      .map(char => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0))
      )
      .join('');
    
    localStorage.setItem(config.storageKey, encryptedValue);
  }
};

/**
 * Check if an API key exists
 */
export const hasApiKey = async (keyType: string): Promise<boolean> => {
  return !!(await getApiKey(keyType));
};

/**
 * Remove an API key from storage
 */
export const removeApiKey = async (keyType: string): Promise<void> => {
  const config = API_KEYS[keyType];
  if (!config) return;
  
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('key_name', config.storageKey);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error removing API key from Supabase:', error);
    
    // Fallback to localStorage if Supabase is not available
    localStorage.removeItem(config.storageKey);
  }
};

/**
 * Get all missing required API keys
 */
export const getMissingRequiredKeys = async (): Promise<ApiKeyConfig[]> => {
  const missingKeys = [];
  
  for (const [keyType, config] of Object.entries(API_KEYS)) {
    if (config.isRequired && !(await hasApiKey(keyType))) {
      missingKeys.push(config);
    }
  }
  
  return missingKeys;
};
