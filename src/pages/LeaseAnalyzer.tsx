
import React, { useState } from "react";
import { FileDropZone } from "@/components/lease/FileDropZone";
import { LeaseAnalysisDisplay } from "@/components/lease/LeaseAnalysisDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DebugInfo } from "@/components/negotiation/DebugInfo";

interface LeaseAnalysis {
  rent: number;
  deposit: number;
  termMonths: number;
  flags: {
    level: 'high' | 'medium' | 'low';
    clause: string;
    line: number;
  }[];
  summary: string;
}

export default function LeaseAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<LeaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();
  
  // Function to handle file selection and analysis
  const handleFileSelected = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setIsLoading(true);
      setError(null);
      setProgress(10);
      
      // Convert file to base64
      const fileBytes = await readFileAsArrayBuffer(selectedFile);
      const base64File = arrayBufferToBase64(fileBytes);
      
      setProgress(30);
      
      // Record request start time for debug info
      const requestStartTime = new Date().toISOString();
      setDebugInfo(prev => ({ ...prev, requestStartTime }));
      
      // Call the claude-lease-analyzer function directly
      const { data, error: analyzeError } = await supabase.functions.invoke('claude-lease-analyzer', {
        body: {
          documentBytes: base64File,
          documentType: selectedFile.type,
          debug: true
        }
      });
      
      // Record request end time for debug info
      const requestEndTime = new Date().toISOString();
      setDebugInfo(prev => ({ 
        ...prev, 
        requestEndTime,
        httpStatus: analyzeError ? 500 : 200,
        rawResponse: data
      }));
      
      if (analyzeError) {
        throw new Error(`Analysis failed: ${analyzeError.message}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setProgress(100);
      
      // Transform the data to match our LeaseAnalysis interface
      const transformedAnalysis: LeaseAnalysis = {
        rent: data.extractedData?.financial?.rent?.amount || 0,
        deposit: data.extractedData?.financial?.securityDeposit || 0,
        termMonths: data.extractedData?.term?.durationMonths || 12,
        flags: data.unusualClauses?.map(clause => ({
          level: clause.riskLevel || 'medium',
          clause: clause.clause,
          line: 0 // Claude doesn't provide line numbers
        })) || [],
        summary: data.summary || ""
      };
      
      setAnalysis(transformedAnalysis);
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
  };
  
  // Helper function to read file as ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Helper function to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  };
  
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
