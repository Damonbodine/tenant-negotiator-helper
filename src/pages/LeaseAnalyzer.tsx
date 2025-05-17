
import React, { useEffect, useState } from "react";
import { FileDropZone } from "@/components/lease/FileDropZone";
import { LeaseAnalysisDisplay } from "@/components/lease/LeaseAnalysisDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Flag {
  level: 'high' | 'medium' | 'low';
  clause: string;
  line: number;
}

interface LeaseAnalysis {
  rent: number;
  deposit: number;
  termMonths: number;
  flags: Flag[];
  summary: string;
}

export default function LeaseAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LeaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file upload and analysis
  const handleFileSelected = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setIsLoading(true);
      setProgress(10);
      setError(null);
      setAnalysis(null);
      
      // Check if user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("You must be logged in to analyze lease documents");
      }
      
      // Create a lease record in the database
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .insert({
          filename: selectedFile.name,
          user_id: userData.user.id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (leaseError) {
        throw new Error(`Database error: ${leaseError.message}`);
      }
      
      setLeaseId(leaseData.id);
      setProgress(20);
      
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const filePath = `${leaseData.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('leases')
        .upload(filePath, selectedFile);
      
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      setProgress(40);
      
      // Get signed URL for the file
      const { data: urlData, error: urlError } = await supabase.storage
        .from('leases')
        .createSignedUrl(filePath, 60 * 15); // 15 minutes expiry
      
      if (urlError || !urlData) {
        throw new Error("Failed to get file URL");
      }
      
      setProgress(50);
      
      // Call the lease-analyzer function
      const { error: analyzeError } = await supabase.functions.invoke('lease-analyzer', {
        body: {
          leaseId: leaseData.id,
          fileExt,
          publicUrl: urlData.signedUrl
        }
      });
      
      if (analyzeError) {
        throw new Error(`Analysis failed: ${analyzeError.message}`);
      }
      
      setProgress(60);
      toast({
        title: "Analysis started",
        description: "Your lease is being processed. Please wait for the results."
      });
      
      // Poll for results
      await pollForResults(leaseData.id);
    } catch (err) {
      console.error("Error processing lease:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process your lease document"
      });
    }
  };
  
  // Poll for results until we get a complete status
  const pollForResults = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts x 3 seconds = 3 minutes max
    
    const poll = async () => {
      attempts++;
      setProgress(60 + Math.min(30, attempts * 0.5)); // Progress from 60% to 90%
      
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        setError(`Failed to check analysis status: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (data.status === 'complete' && data.analysis) {
        setProgress(100);
        // Safely cast analysis data - we need to check if it has the required fields
        if (
          typeof data.analysis === 'object' && 
          data.analysis !== null && 
          !Array.isArray(data.analysis) &&
          'rent' in data.analysis &&
          'deposit' in data.analysis &&
          'termMonths' in data.analysis &&
          'flags' in data.analysis &&
          'summary' in data.analysis
        ) {
          // Now we can safely cast it to LeaseAnalysis
          setAnalysis(data.analysis as LeaseAnalysis);
        } else {
          setError("Invalid analysis format received");
          console.error("Invalid analysis format:", data.analysis);
        }
        setIsLoading(false);
        toast({
          title: "Analysis complete",
          description: "Your lease has been successfully analyzed."
        });
      } else if (data.status === 'error') {
        setError(`Analysis error: ${data.error || "Unknown error"}`);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: data.error || "Failed to analyze your lease document"
        });
      } else if (attempts < maxAttempts) {
        // Continue polling
        setTimeout(poll, 3000);
      } else {
        // Timeout
        setError("Analysis is taking too long. Please try again later.");
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Timeout",
          description: "Analysis is taking too long. Please try again later."
        });
      }
    };
    
    await poll();
  };
  
  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Lease Analyzer</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your lease document to get an automated analysis of key terms and potential issues.
        </p>
      </div>
      
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
