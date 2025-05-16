
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeaseResultsView } from "./LeaseResultsView";
import { DebugInfo } from "@/components/negotiation/DebugInfo";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Upload, Bug } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { processDocumentWithAI } from "./utils/documentAiUtils";
import { LeaseAnalysisResult } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

export function LeaseAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [analysisResults, setAnalysisResults] = useState<LeaseAnalysisResult | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [processingPhase, setProcessingPhase] = useState<string>('');
  
  // Debug states
  const [showDebug, setShowDebug] = useState(false);
  const [requestStartTime, setRequestStartTime] = useState<string | null>(null);
  const [requestEndTime, setRequestEndTime] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [rawErrorResponse, setRawErrorResponse] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file);
      setProgress(0);
      // Reset debug info
      setRawErrorResponse(null);
      setHttpStatus(null);
      setDebugInfo({});
    } else if (file) {
      toast({
        title: "Invalid File",
        description: file.type !== 'application/pdf' 
          ? "Please upload a PDF file." 
          : "Please upload a PDF under 10MB.",
        variant: "destructive"
      });
    }
  };

  // This function tests the Lease Analyzer function with a test mode
  const handleTestMode = async () => {
    try {
      setStep(STEPS.PROCESSING);
      setProgress(0);
      setProcessingPhase('Running diagnostics test...');
      setRequestStartTime(new Date().toISOString());
      setRawErrorResponse(null);
      setHttpStatus(null);
      
      // Create a small test PDF file (1 KB)
      const testPdfBlob = new Blob(['%PDF-1.5 Test PDF'], { type: 'application/pdf' });
      const testFile = new File([testPdfBlob], "test.pdf", { type: 'application/pdf' });
      
      setProgress(30);
      setProcessingPhase('Sending test document...');
      
      // Direct call to the lease-analyzer function with both fileBase64 and text fields
      const response = await supabase.functions.invoke('lease-analyzer', {
        body: {
          fileBase64: 'JVBERi0xLjUgVGVzdCBQREY=', // "%PDF-1.5 Test PDF" in base64
          fileName: "test.pdf",
          fileType: "application/pdf",
          fileSize: 14,
          text: "Sample text content for test mode", // Add text field for compatibility
          testMode: true // Explicitly indicate test mode
        }
      });
      
      setRequestEndTime(new Date().toISOString());
      setProgress(100);
      
      if (response.error) {
        console.error("Test mode error:", response.error);
        setRawErrorResponse(JSON.stringify(response.error, null, 2));
        setHttpStatus(500);
        
        toast({
          title: "Test Failed",
          description: `Error: ${response.error.message || "Unknown error"}`,
          variant: "destructive"
        });
        
        setStep(STEPS.UPLOAD);
        return;
      }
      
      setHttpStatus(200);
      setAnalysisResults(response.data?.analysis || {
        summary: "Test successful but no analysis data returned",
        confidence: 0
      });
      
      setDebugInfo(prev => ({
        ...prev,
        testMode: true,
        responseData: response.data
      }));
      
      setStep(STEPS.RESULTS);
      
      toast({
        title: "Test Successful",
        description: "The lease analyzer function is working correctly.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error in test mode:", error);
      setRawErrorResponse(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      setRequestEndTime(new Date().toISOString());
      setHttpStatus(500);
      setStep(STEPS.UPLOAD);
      
      toast({
        title: "Test Failed",
        description: "An error occurred during the test. See debug info for details.",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) return;

    try {
      setStep(STEPS.PROCESSING);
      setProgress(0);
      setProcessingPhase('Preparing document for analysis...');
      setRequestStartTime(new Date().toISOString());
      setRawErrorResponse(null);
      setHttpStatus(null);
      
      // Process the document with Google Document AI
      const result = await processDocumentWithAI(
        selectedFile, 
        (percent, phase) => {
          setProgress(percent);
          setProcessingPhase(phase);
          setDebugInfo(prev => ({ ...prev, currentProgress: percent, currentPhase: phase }));
        }
      );
      
      setRequestEndTime(new Date().toISOString());
      
      setDebugInfo(prev => ({
        ...prev,
        responseReceived: true,
        responseTime: `${new Date().getTime() - new Date(requestStartTime!).getTime()}ms`,
        resultSize: JSON.stringify(result).length,
      }));
      
      if (!result) {
        throw new Error("No results returned from analysis");
      }
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Set analysis results and move to results step
      setAnalysisResults(result.analysis);
      setHttpStatus(200);
      setStep(STEPS.RESULTS);
      
      toast({
        title: "Analysis Complete",
        description: "Your lease has been analyzed successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error in lease analysis process:", error);
      setRawErrorResponse(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
      setProgress(100);
      setRequestEndTime(new Date().toISOString());
      setHttpStatus(500);
      setStep(STEPS.UPLOAD);
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep(STEPS.UPLOAD);
    setAnalysisResults(null);
    setProgress(0);
    setRawErrorResponse(null);
    setDebugInfo({});
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lease Analyzer</h1>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleTestMode}
          >
            <Bug className="mr-1 h-4 w-4" />
            Run Test
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>
      </div>
      
      <DebugInfo
        showDebugInfo={showDebug}
        httpStatus={httpStatus}
        requestStartTime={requestStartTime}
        requestEndTime={requestEndTime}
        rawErrorResponse={rawErrorResponse}
        additionalInfo={debugInfo}
      />

      {step === STEPS.UPLOAD && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            
            <h2 className="text-xl font-medium mb-2">Upload Your Lease</h2>
            <p className="text-gray-500 mb-4">Upload a PDF lease agreement to analyze its terms and conditions</p>
            
            <Input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange}
              className="mb-4"
            />
            
            <p className="text-sm text-gray-500 mb-4">Upload a PDF lease document (Max 10MB)</p>
            
            {selectedFile && (
              <div className="mt-4">
                <p className="text-sm font-medium">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
                <Button 
                  onClick={handleAnalyzeDocument} 
                  className="mt-4"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Lease
                </Button>
              </div>
            )}
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">How It Works</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-2">Our AI-powered lease analyzer will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Extract key terms from your lease</li>
                <li>Identify monthly rent, security deposit, and other financial obligations</li>
                <li>Find important dates like move-in and rent due dates</li>
                <li>Highlight potential red flags or concerning clauses</li>
                <li>Summarize tenant and landlord responsibilities</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {step === STEPS.PROCESSING && (
        <div className="space-y-6">
          <div className="p-8 border rounded-lg bg-blue-50">
            <div className="flex items-center mb-6">
              <Loader2 className="h-6 w-6 mr-3 animate-spin text-blue-500" />
              <p className="font-medium text-blue-800 text-lg">{processingPhase}</p>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-blue-600 text-center">{progress}% complete</p>
          </div>
        </div>
      )}
      
      {step === STEPS.RESULTS && analysisResults && (
        <LeaseResultsView analysis={analysisResults} onAnalyzeAnother={handleReset} />
      )}
    </div>
  );
}
