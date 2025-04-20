
// Store in browser localStorage
export const saveApiKey = async (keyName: string, value: string) => {
  localStorage.setItem(`apiKey_${keyName}`, value);
};

export const getApiKey = async (keyName: string) => {
  return localStorage.getItem(`apiKey_${keyName}`);
};

export const hasApiKey = async (keyName: string) => {
  const key = localStorage.getItem(`apiKey_${keyName}`);
  return key !== null && key.length > 0;
};
