
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/shared/hooks/use-toast';
import { AddressAnalysisRequest, AddressAnalysisResponse } from '@/shared/types/analyzer';

export const analyzeAddressWithSupabase = async (request: AddressAnalysisRequest): Promise<AddressAnalysisResponse> => {
  try {
    console.log('Forwarding request to address-analyzer function with data:', request);
    
    const { data, error } = await supabase.functions.invoke('address-analyzer', {
      body: request
    });

    if (error) {
      console.error('Error from address-analyzer function:', error);
      throw new Error(error.message || 'Error analyzing address');
    }

    if (!data) {
      throw new Error('No data returned from address analyzer');
    }

    console.log('Response from address-analyzer function:', data);
    return data as AddressAnalysisResponse;
  } catch (error: any) {
    console.error('Error in analyzeAddressWithSupabase:', error);
    
    toast({
      title: "Address Analysis Failed",
      description: error.message || "Unable to analyze that address. Please try with a more specific address.",
      variant: "destructive",
    });
    
    return {
      address: request.address,
      text: "",
      error: error.message,
      message: "Please try a different address or check the format"
    };
  }
};
