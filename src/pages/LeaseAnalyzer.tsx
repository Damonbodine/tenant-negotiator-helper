
import React, { useState } from 'react';
import { FileDropZone } from "@/components/lease/FileDropZone";
import { LeaseAnalysisDisplay } from "@/components/lease/LeaseAnalysisDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { DebugInfo } from "@/components/negotiation/DebugInfo";

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

      // Call the claude-lease-analyzer function directly
      const response = await fetch('/functions/v1/claude-lease-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Record request end time for debug info
      const requestEndTime = new Date().toISOString();
      setDebugInfo(prev => ({ 
        ...prev, 
        requestEndTime,
        httpStatus: response.status
      }));

      if (!response.ok) {
        const errorBody = await response.text();
        setDebugInfo(prev => ({ ...prev, rawErrorResponse: errorBody }));
        throw new Error(`API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
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
            line: 0 // Claude doesn't provide line numbers
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
        httpStatus={debugInfo.httpStatus}
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
