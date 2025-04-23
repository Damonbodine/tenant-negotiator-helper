
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/shared/hooks/use-toast';

export interface AddressAnalysisRequest {
  address: string;
  beds?: number;
  baths?: number;
  propertyType?: string;
}

export async function analyzeAddressWithSupabase(request: AddressAnalysisRequest) {
  if (!request.address) {
    throw new Error('Address is required');
  }
  
  console.log('Forwarding request to address-analyzer function with data:', request);
  
  try {
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
      description: error.message || "Unable to analyze that address. Please try a different one or check the format.",
      variant: "destructive",
    });
    
    throw error;
  }
}
