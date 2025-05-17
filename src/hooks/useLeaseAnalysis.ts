
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface Flag {
  level: 'high' | 'medium' | 'low';
  clause: string;
  line: number;
}

export interface LeaseAnalysis {
  rent: number;
  deposit: number;
  termMonths: number;
  flags: Flag[];
  summary: string;
}

interface LeaseAnalysisResult {
  status: string | null;
  analysis: LeaseAnalysis | null;
  error: string | null;
  isLoading: boolean;
  progress: number;
}

// Helper function to validate the analysis structure
const isValidLeaseAnalysis = (data: Json | null): data is LeaseAnalysis => {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'rent' in data &&
    'deposit' in data &&
    'termMonths' in data &&
    'flags' in data &&
    'summary' in data
  );
};

export const useLeaseAnalysis = (leaseId: string | null): LeaseAnalysisResult => {
  const [status, setStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LeaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!leaseId) return;

    setIsLoading(true);
    setProgress(60); // Start from 60% assuming file upload is complete

    // Initial fetch
    const fetchLease = async () => {
      const { data, error: fetchError } = await supabase
        .from('leases')
        .select('status, analysis, error')
        .eq('id', leaseId)
        .single();

      if (fetchError) {
        setError(`Failed to get lease data: ${fetchError.message}`);
        setIsLoading(false);
        return;
      }

      if (data) {
        setStatus(data.status);
        
        if (data.error) {
          setError(data.error);
        }
        
        if (data.status === 'complete' && data.analysis) {
          setProgress(100);
          
          if (isValidLeaseAnalysis(data.analysis)) {
            setAnalysis(data.analysis as LeaseAnalysis);
          } else {
            setError('Invalid analysis format received');
            console.error('Invalid analysis format:', data.analysis);
          }
          
          setIsLoading(false);
        }
      }
    };

    fetchLease();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`lease-${leaseId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leases', filter: `id=eq.${leaseId}` },
        (payload) => {
          const updated = payload.new as {
            status: string;
            analysis: Json;
            error: string | null;
          };

          setStatus(updated.status);
          
          if (updated.error) {
            setError(updated.error);
            setIsLoading(false);
          }

          // Update progress based on status
          if (updated.status === 'processing') {
            setProgress(Math.min(90, progress + 5));
          }
          
          if (updated.status === 'complete' && updated.analysis) {
            setProgress(100);
            
            if (isValidLeaseAnalysis(updated.analysis)) {
              setAnalysis(updated.analysis as LeaseAnalysis);
            } else {
              setError('Invalid analysis format received');
              console.error('Invalid analysis format:', updated.analysis);
            }
            
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [leaseId, progress]);

  return { status, analysis, error, isLoading, progress };
};
