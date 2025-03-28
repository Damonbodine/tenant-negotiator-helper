
/**
 * Key Manager utility for securely handling API keys
 * This provides a basic level of obfuscation, but a backend solution like Supabase
 * would be recommended for production applications
 */

// Simple encryption key - in a real app, this would be a secure server-side secret
const ENCRYPTION_KEY = "rentcoach-app-encryption";

/**
 * Basic encryption for API keys stored in localStorage
 * Note: This is obfuscation rather than true encryption
 * For production, use a backend service like Supabase
 */
const encrypt = (text: string): string => {
  // Simple XOR encryption - basic obfuscation only
  return Array.from(text)
    .map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0))
    )
    .join('');
};

/**
 * Decrypt stored API keys
 */
const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  // Reverse the XOR operation
  return Array.from(encryptedText)
    .map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0))
    )
    .join('');
};

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
  // Add additional API keys here as needed
};

/**
 * Get an API key from storage
 */
export const getApiKey = (keyType: string): string | null => {
  const config = API_KEYS[keyType];
  if (!config) return null;
  
  const encryptedKey = localStorage.getItem(config.storageKey);
  return encryptedKey ? decrypt(encryptedKey) : null;
};

/**
 * Save an API key to storage with basic encryption
 */
export const saveApiKey = (keyType: string, value: string): void => {
  const config = API_KEYS[keyType];
  if (!config) return;
  
  const encryptedValue = encrypt(value);
  localStorage.setItem(config.storageKey, encryptedValue);
};

/**
 * Check if an API key exists
 */
export const hasApiKey = (keyType: string): boolean => {
  return !!getApiKey(keyType);
};

/**
 * Remove an API key from storage
 */
export const removeApiKey = (keyType: string): void => {
  const config = API_KEYS[keyType];
  if (!config) return;
  
  localStorage.removeItem(config.storageKey);
};

/**
 * Get all missing required API keys
 */
export const getMissingRequiredKeys = (): ApiKeyConfig[] => {
  return Object.values(API_KEYS)
    .filter(config => config.isRequired && !hasApiKey(config.name));
};

