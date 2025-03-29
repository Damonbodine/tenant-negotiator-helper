
import { supabase } from '@/integrations/supabase/client';
import { API_KEYS } from './keyManager';

/**
 * Migrate API keys from localStorage to Supabase
 * This should be called once when the app is upgraded to use Supabase
 */
export const migrateApiKeysToSupabase = async (): Promise<void> => {
  // Check if migration has already been performed
  const migrationKey = 'api_keys_migrated_to_supabase';
  if (localStorage.getItem(migrationKey) === 'true') {
    console.log('API keys already migrated to Supabase');
    return;
  }
  
  // Simple decryption for the legacy localStorage keys
  const decrypt = (encryptedText: string): string => {
    if (!encryptedText) return '';
    
    const ENCRYPTION_KEY = "rentcoach-app-encryption";
    // Reverse the XOR operation
    return Array.from(encryptedText)
      .map(char => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0))
      )
      .join('');
  };
  
  // Migrate each API key
  for (const config of Object.values(API_KEYS)) {
    const encryptedKey = localStorage.getItem(config.storageKey);
    if (encryptedKey) {
      const decryptedKey = decrypt(encryptedKey);
      
      // Save to Supabase
      try {
        const { error } = await supabase
          .from('api_keys')
          .insert({ key_name: config.storageKey, key_value: decryptedKey });
        
        if (error) {
          console.error(`Error migrating ${config.name} to Supabase:`, error);
        } else {
          console.log(`Successfully migrated ${config.name} to Supabase`);
          // Remove from localStorage after successful migration
          localStorage.removeItem(config.storageKey);
        }
      } catch (error) {
        console.error(`Error accessing Supabase for ${config.name}:`, error);
      }
    }
  }
  
  // Mark migration as complete
  localStorage.setItem(migrationKey, 'true');
  console.log('API key migration to Supabase complete');
};
