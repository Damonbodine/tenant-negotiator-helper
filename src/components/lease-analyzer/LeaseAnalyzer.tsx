
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { LeaseResultsView } from "./LeaseResultsView";
import { DebugInfo } from "@/components/negotiation/DebugInfo";
import { Progress } from "@/components/ui/progress";
import * as pdfjs from "pdfjs-dist";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Set worker path to load from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

export function LeaseAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
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
      setExtractedText(null);
      setProgress(0);
      // Reset debug info
      setRawErrorResponse(null);
      setHttpStatus(null);
      setDebugInfo({});
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF under 10MB.",
        variant: "destructive"
      });
    }
  };
  
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      setProcessingPhase('Extracting text from PDF...');
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF file
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 50)); // First 50% of progress
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      console.log(`Extracted ${fullText.length} characters from PDF`);
      return fullText;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) return;

    try {
      setStep(STEPS.PROCESSING);
      setProgress(0);
      setProcessingPhase('Processing PDF document...');
      setRequestStartTime(new Date().toISOString());
      setRawErrorResponse(null);
      setHttpStatus(null);
      
      // Extract text from PDF first
      const text = await extractTextFromPdf(selectedFile);
      setExtractedText(text);
      setProgress(50);
      setProcessingPhase('Analyzing lease content...');
      setDebugInfo(prev => ({ ...prev, extractedTextLength: text.length }));
      
      // Call the edge function with the extracted text
      console.log(`Sending ${text.length} characters to edge function for analysis`);
      const { data, error, status } = await supabase.functions.invoke('document-ai-lease-analyzer', {
        body: { 
          text: text,
          fileName: selectedFile.name
        }
      });
      
      // Set debug information
      setHttpStatus(status);
      setRequestEndTime(new Date().toISOString());
      setDebugInfo(prev => ({
        ...prev,
        responseData: data,
        requestStatus: status,
        requestDuration: `${new Date().getTime() - new Date(requestStartTime!).getTime()}ms`,
      }));

      if (error) {
        console.error("Lease analysis error:", error);
        setRawErrorResponse(JSON.stringify(error, null, 2));
        setProgress(100);
        toast({
          title: "Analysis Failed",
          description: "There was an error analyzing your lease. See details below.",
          variant: "destructive"
        });
        return;
      }

      // Handle successful response
      setProgress(100);
      
      if (!data) {
        console.error("No data returned from function");
        setRawErrorResponse("No data returned from function call");
        toast({
          title: "Analysis Error",
          description: "No results were returned from the analysis service.",
          variant: "destructive"
        });
        return;
      }
      
      if (data.error) {
        console.error("Error in analysis result:", data.error);
        setRawErrorResponse(JSON.stringify(data.error, null, 2));
        toast({
          title: "Analysis Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      console.log("Lease analysis result:", data);
      setAnalysisResults(data);
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
      toast({
        title: "Analysis Failed",
        description: "An unexpected error occurred. See details below.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep(STEPS.UPLOAD);
    setAnalysisResults(null);
    setExtractedText(null);
    setProgress(0);
    setRawErrorResponse(null);
    setDebugInfo({});
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lease Analyzer</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </Button>
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange}
              className="mb-4"
            />
            <p className="text-sm text-gray-500 mb-2">Upload a PDF lease document (Max 10MB)</p>
            {selectedFile && (
              <div className="mt-4">
                <p className="text-sm font-medium">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
                <Button 
                  onClick={handleAnalyzeDocument} 
                  className="mt-4"
                >
                  Analyze Lease
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {step === STEPS.PROCESSING && (
        <div className="space-y-6">
          <div className="p-6 border rounded-lg bg-blue-50">
            <div className="flex items-center mb-4">
              <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-500" />
              <p className="font-medium text-blue-800">{processingPhase}</p>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-blue-600">{progress}% complete</p>
          </div>
        </div>
      )}
      
      {step === STEPS.RESULTS && analysisResults && (
        <LeaseResultsView analysis={analysisResults} onAnalyzeAnother={handleReset} />
      )}
    </div>
  );
}
