
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/shared/hooks/use-toast';
import { AddressAnalysisRequest, AddressAnalysisResponse } from '@/shared/types/analyzer';

export const analyzeAddressWithSupabase = async (request: AddressAnalysisRequest): Promise<AddressAnalysisResponse> => {
  if (!request || !request.address) {
    throw new Error('Address is required');
  }
  
  try {
    console.log('Forwarding request to address-analyzer function with data:', request);
    
    const { data, error } = await supabase.functions.invoke('address-analyzer', {
      body: request
    });

    if (error) {
      console.error('Error from address-analyzer function:', error);
      throw new Error(error.message || 'Error calling address analyzer');
    }

    if (!data) {
      throw new Error('No data returned from address analyzer');
    }

    console.log('Response from address-analyzer function:', data);
    return data;
  } catch (error: any) {
    console.error('Error in analyzeAddressWithSupabase:', error);
    
    toast({
      title: "Address Analysis Failed",
      description: error.message || "Unable to analyze that address. Please try a different address or format.",
      variant: "destructive",
    });
    
    throw error;
  }
};
