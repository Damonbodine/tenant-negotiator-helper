
import { supabase } from '@/integrations/supabase/client';

export const analyzeListingWithSupabase = async (url: string) => {
  if (!url) {
    throw new Error('URL is required');
  }
  
  console.log('Forwarding request to listing-analyzer function with URL:', url);
  
  const { data, error } = await supabase.functions.invoke('listing-analyzer', {
    body: { url }
  });

  if (error) {
    console.error('Error from listing-analyzer function:', error);
    throw new Error(error.message || 'Error calling listing analyzer');
  }

  console.log('Response from listing-analyzer function:', data);
  return data;
};
