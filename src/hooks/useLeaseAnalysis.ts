
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

// Cache for storing analysis results
const analysisCache = new Map<string, any>();

// Type guard function to ensure data is a valid LeaseAnalysis
function isLeaseAnalysis(data: any): data is LeaseAnalysis {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'rent' in data &&
    'deposit' in data &&
    'termMonths' in data &&
    'flags' in data &&
    'summary' in data &&
    Array.isArray(data.flags)
  );
}

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

    // Check if we have cached results
    if (analysisCache.has(leaseId)) {
      const cachedData = analysisCache.get(leaseId);
      setStatus(cachedData.status);
      if (cachedData.error) {
        setError(cachedData.error);
      }
      if (cachedData.status === 'complete' && cachedData.analysis) {
        setProgress(100);
        if (isLeaseAnalysis(cachedData.analysis)) {
          setAnalysis(cachedData.analysis);
        }
        setIsLoading(false);
      }
      return;
    }

    // Set up polling for analysis results
    const pollInterval = 3000; // 3 seconds
    let pollTimer: number | null = null;
    
    const checkAnalysisStatus = async () => {
      try {
        // Check for results from edge function
        const { data, error: fetchError } = await supabase.functions.invoke('lease-analyzer', {
          body: { leaseId, action: 'getStatus' }
        });

        if (fetchError) {
          throw new Error(`Failed to get analysis status: ${fetchError.message}`);
        }

        if (data) {
          setStatus(data.status);
          
          // Update cache
          analysisCache.set(leaseId, data);
          
          if (data.error) {
            setError(data.error);
            setIsLoading(false);
            // Clear polling
            if (pollTimer !== null) {
              window.clearTimeout(pollTimer);
            }
          }
          
          // Update progress based on status
          if (data.status === 'processing') {
            setProgress(Math.min(90, progress + 5));
          }
          
          if (data.status === 'complete' && data.analysis) {
            setProgress(100);
            
            if (isLeaseAnalysis(data.analysis)) {
              setAnalysis(data.analysis);
            } else {
              setError('Invalid analysis format received');
              console.error('Invalid analysis format:', data.analysis);
            }
            
            setIsLoading(false);
            // Clear polling
            if (pollTimer !== null) {
              window.clearTimeout(pollTimer);
            }
          } else {
            // Continue polling if not complete
            pollTimer = window.setTimeout(checkAnalysisStatus, pollInterval);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
        // Clear polling
        if (pollTimer !== null) {
          window.clearTimeout(pollTimer);
        }
      }
    };

    // Start initial check
    checkAnalysisStatus();

    return () => {
      // Cleanup polling on unmount
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [leaseId, progress]);

  return { status, analysis, error, isLoading, progress };
};
