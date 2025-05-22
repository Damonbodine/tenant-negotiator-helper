
import { supabase } from '@/integrations/supabase/client';

interface AnalyzeAddressParams {
  address: string;
  memories?: string[];
}

interface AnalyzeAddressResponse {
  address: string;
  text: string;
  model?: string;
  error?: string;
}

/**
 * Analyzes an address using the address-analyzer edge function
 */
export async function analyzeAddressWithSupabase(
  params: AnalyzeAddressParams
): Promise<AnalyzeAddressResponse> {
  try {
    console.log(`Analyzing address with Supabase: ${params.address}`);
    
    // Check if memories are provided
    const hasMemories = params.memories && params.memories.length > 0;
    if (hasMemories) {
      console.log(`Including ${params.memories?.length} memories in analysis`);
    }
    
    const { data, error } = await supabase.functions.invoke('address-analyzer', {
      body: { 
        address: params.address,
        memories: params.memories || []
      }
    });

    if (error) {
      console.error('Error analyzing address:', error);
      throw new Error(error.message || 'Failed to analyze address');
    }

    console.log('Address analysis complete');
    return data as AnalyzeAddressResponse;
  } catch (error) {
    console.error('Error in analyzeAddressWithSupabase:', error);
    throw error;
  }
}
