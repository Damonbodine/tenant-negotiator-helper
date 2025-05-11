
// Define the API keys configuration
export interface ApiKeyConfig {
  name: string;
  storageKey: string;
}

export const API_KEYS: Record<string, ApiKeyConfig> = {
  CLAUDE: {
    name: 'Claude API Key',
    storageKey: 'apiKey_ANTHROPIC_API_KEY'
  },
  GOOGLE: {
    name: 'Google Document AI API Key',
    storageKey: 'apiKey_GOOGLE_DOCUMENTAI_API_KEY'
  },
  OPENAI: {
    name: 'OpenAI API Key',
    storageKey: 'apiKey_OPENAI_RENTERS_MENTOR_KEY'
  }
};

// Store in browser localStorage
export const saveApiKey = async (keyName: string, value: string) => {
  try {
    localStorage.setItem(`apiKey_${keyName}`, value);
    console.log(`Saved API key ${keyName} to localStorage`);
    return true;
  } catch (error) {
    console.error(`Error saving API key ${keyName}:`, error);
    throw error;
  }
};

export const getApiKey = async (keyName: string) => {
  try {
    const key = localStorage.getItem(`apiKey_${keyName}`);
    return key;
  } catch (error) {
    console.error(`Error retrieving API key ${keyName}:`, error);
    throw error;
  }
};

export const hasApiKey = async (keyName: string) => {
  try {
    const key = localStorage.getItem(`apiKey_${keyName}`);
    return key !== null && key.length > 0;
  } catch (error) {
    console.error(`Error checking API key ${keyName}:`, error);
    return false;
  }
};
