
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('Forwarding request to listing-analyzer function with URL:', url);
    
    const { data, error } = await supabase.functions.invoke('listing-analyzer', {
      body: { url }
    });

    if (error) {
      console.error('Error from listing-analyzer function:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Response from listing-analyzer function:', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in listing-analyzer API route:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
