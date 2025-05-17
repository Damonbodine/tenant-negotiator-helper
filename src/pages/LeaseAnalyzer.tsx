
import React, { useState } from "react";
import { FileDropZone } from "@/components/lease/FileDropZone";
import { LeaseAnalysisDisplay } from "@/components/lease/LeaseAnalysisDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLeaseAnalysis, LeaseAnalysis, Flag } from "@/hooks/useLeaseAnalysis";

export default function LeaseAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use our new hook to handle lease analysis
  const { status, analysis, error, isLoading, progress } = useLeaseAnalysis(leaseId);

  // Handle file upload and analysis
  const handleFileSelected = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      
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
      
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const filePath = `${leaseData.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('leases')
        .upload(filePath, selectedFile);
      
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      // Get signed URL for the file
      const { data: urlData, error: urlError } = await supabase.storage
        .from('leases')
        .createSignedUrl(filePath, 60 * 15); // 15 minutes expiry
      
      if (urlError || !urlData) {
        throw new Error("Failed to get file URL");
      }
      
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
      
      toast({
        title: "Analysis started",
        description: "Your lease is being processed. Please wait for the results."
      });
      
    } catch (err) {
      console.error("Error processing lease:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process your lease document"
      });
    }
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
