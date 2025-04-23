
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/shared/hooks/use-toast';

export const analyzeListingWithSupabase = async (url: string) => {
  if (!url) {
    throw new Error('URL is required');
  }
  
  console.log('Forwarding request to listing-analyzer function with URL:', url);
  
  try {
    const { data, error } = await supabase.functions.invoke('listing-analyzer', {
      body: { url }
    });

    if (error) {
      console.error('Error from listing-analyzer function:', error);
      throw new Error(error.message || 'Error calling listing analyzer');
    }

    if (!data) {
      throw new Error('No data returned from listing analyzer');
    }

    console.log('Response from listing-analyzer function:', data);
    return data;
  } catch (error: any) {
    console.error('Error in analyzeListingWithSupabase:', error);
    
    // Show a helpful toast message
    toast({
      title: "Listing Analysis Failed",
      description: error.message || "Unable to analyze that listing. Try a different site like Apartments.com or Realtor.com",
      variant: "destructive",
    });
    
    throw error;
  }
};
