
import React, { useState } from 'react';
import { FileDropZone } from "@/components/lease/FileDropZone";
import { LeaseAnalysisDisplay } from "@/components/lease/LeaseAnalysisDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { DebugInfo } from "@/components/negotiation/DebugInfo";
import { createClient } from "@supabase/supabase-js";

/* Helper to validate the JSON coming back */
interface Flag { level: 'high'|'medium'|'low'; clause: string; line: number }
interface LeaseAnalysis {
  rent: number;
  deposit: number;
  termMonths: number;
  flags: Flag[];
  summary: string;
}

function isLeaseAnalysis(data: any): data is LeaseAnalysis {
  return (
    data && typeof data === 'object' &&
    'rent' in data && 'deposit' in data &&
    'termMonths' in data && 'flags' in data && 'summary' in data
  );
}

// Create a Supabase client for direct function invocation
// Hardcode the values to guarantee they're available
const supabaseUrl = "https://izzdyfrcxunfzlfgdjuv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LeaseAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<LeaseAnalysis|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();

  async function handleFileSelected(selectedFile: File) {
    try {
      setFile(selectedFile);
      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      setProgress(10);

      // Record request start time for debug info
      const requestStartTime = new Date().toISOString();
      setDebugInfo(prev => ({ ...prev, requestStartTime }));

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
      
      setProgress(30);
      
      const payload = {
        documentBytes: base64.split(',')[1],
        documentType: selectedFile.type,
        debug: true
      };

      // Use direct Supabase function invocation with the updated function name
      console.log('Invoking lease-doc-analyzer function...');
      const { data, error: fnError } = await supabase.functions.invoke('lease-doc-analyzer', {
        body: payload,
      });

      // Record request end time for debug info
      const requestEndTime = new Date().toISOString();
      setDebugInfo(prev => ({ 
        ...prev, 
        requestEndTime,
        responseStatus: fnError ? 'error' : 'success'
      }));

      if (fnError) {
        console.error('Function error:', fnError);
        setDebugInfo(prev => ({ ...prev, rawErrorResponse: fnError }));
        throw new Error(`Function error: ${fnError.message || JSON.stringify(fnError)}`);
      }

      console.log('Function response:', data);
      setDebugInfo(prev => ({ ...prev, rawResponse: data }));
      
      setProgress(100);
      
      if (isLeaseAnalysis(data)) {
        setAnalysis(data);
      } else {
        // Try to transform the data to match our LeaseAnalysis interface
        const transformedAnalysis: LeaseAnalysis = {
          rent: data.extractedData?.financial?.rent?.amount || 0,
          deposit: data.extractedData?.financial?.securityDeposit || 0,
          termMonths: data.extractedData?.term?.durationMonths || 12,
          flags: data.unusualClauses?.map((clause: any) => ({
            level: clause.riskLevel || 'medium',
            clause: clause.clause,
            line: 0 // Line numbers may not be available
          })) || [],
          summary: data.summary || ""
        };
        
        if (isLeaseAnalysis(transformedAnalysis)) {
          setAnalysis(transformedAnalysis);
        } else {
          throw new Error('Unexpected response format from analyzer');
        }
      }
      
      setIsLoading(false);
      
      toast({
        title: "Analysis complete",
        description: "Your lease document has been analyzed."
      });
      
    } catch (err) {
      console.error("Error processing lease:", err);
      setIsLoading(false);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Failed to process your lease document");
      
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process your lease document"
      });
    }
  }
  
  // Check if we're in debug mode
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
  
  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Lease Analyzer</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your lease document to get an automated analysis of key terms and potential issues.
        </p>
      </div>
      
      {/* Debug info when debug mode is active */}
      <DebugInfo 
        showDebugInfo={isDebugMode}
        httpStatus={debugInfo.responseStatus}
        requestStartTime={debugInfo.requestStartTime}
        requestEndTime={debugInfo.requestEndTime}
        rawErrorResponse={debugInfo.rawErrorResponse}
        additionalInfo={debugInfo.rawResponse}
      />
      
      {!isLoading && !analysis && (
        <FileDropZone 
          accept=".pdf,.docx,.txt,.rtf" 
          onFileSelected={handleFileSelected} 
          isLoading={isLoading}
        />
      )}
      
      {(isLoading || analysis) && (
        <LeaseAnalysisDisplay 
          analysis={analysis} 
          isLoading={isLoading} 
          progress={progress} 
        />
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Sticky disclaimer footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 px-4 bg-amber-50 border-t border-amber-200 text-center text-sm">
        <p className="font-medium">
          Information only — <strong className="font-bold">not legal advice</strong>.
        </p>
      </footer>
    </div>
  );
}
