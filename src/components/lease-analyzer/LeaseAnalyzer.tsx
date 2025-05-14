
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { LeaseAnalysisResult } from "./types";
import { LeaseResultsView } from "./LeaseResultsView";
import { DebugInfo } from "@/components/negotiation/DebugInfo";

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

export function LeaseAnalyzer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<LeaseAnalysisResult | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<{
    httpStatus: number | null;
    requestStartTime: string | null;
    requestEndTime: string | null;
    rawErrorResponse: string | null;
    additionalInfo: Record<string, any>;
  }>({
    httpStatus: null,
    requestStartTime: null,
    requestEndTime: null,
    rawErrorResponse: null,
    additionalInfo: {}
  });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Unsupported file format",
          description: "Please upload a PDF file.",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a PDF smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // We'll use PDF.js to extract text from the PDF client-side
    const pdfjsLib = await import('pdfjs-dist');
    // Set worker path to pdf.js worker
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    return new Promise(async (resolve, reject) => {
      try {
        setDebugData(prev => ({
          ...prev,
          additionalInfo: {
            ...prev.additionalInfo,
            pdfExtraction: "Started PDF text extraction"
          }
        }));

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        const numPages = pdf.numPages;
        let text = '';
        
        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
          setProcessingProgress(Math.floor((i / numPages) * 30)); // First 30% is text extraction
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }
        
        setDebugData(prev => ({
          ...prev,
          additionalInfo: {
            ...prev.additionalInfo,
            pdfExtraction: `Completed extraction: ${numPages} pages, ${text.length} characters`
          }
        }));

        resolve(text);
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
        setDebugData(prev => ({
          ...prev,
          additionalInfo: {
            ...prev.additionalInfo,
            pdfExtraction: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        }));
        reject(error);
      }
    });
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setStep(STEPS.PROCESSING);
    setProcessingProgress(0);
    setDebugData({
      httpStatus: null,
      requestStartTime: new Date().toISOString(),
      requestEndTime: null,
      rawErrorResponse: null,
      additionalInfo: {
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(2)} KB`,
        fileType: selectedFile.type
      }
    });
    
    try {
      // Extract text from the PDF client-side to avoid large file uploads
      toast({
        title: "Extracting text",
        description: "Reading your lease document...",
      });
      
      const extractedText = await extractTextFromPdf(selectedFile);
      setProcessingProgress(30);
      
      // Now send the text to our edge function for analysis
      toast({
        title: "Analyzing document",
        description: "Using AI to analyze your lease terms...",
      });

      setDebugData(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          apiCall: "Sending request to document-ai-lease-analyzer",
          textLength: `${extractedText.length} characters`,
          textPreview: extractedText.substring(0, 150) + "..."
        }
      }));

      const requestStartTime = Date.now();
      const { data, error } = await supabase.functions.invoke('document-ai-lease-analyzer', {
        body: { text: extractedText, fileName: selectedFile.name }
      });
      const requestEndTime = Date.now();

      setDebugData(prev => ({
        ...prev,
        requestEndTime: new Date().toISOString(),
        httpStatus: error ? 500 : 200,
        additionalInfo: {
          ...prev.additionalInfo,
          responseTime: `${requestEndTime - requestStartTime}ms`,
          error: error ? JSON.stringify(error) : null
        }
      }));

      if (error) {
        throw new Error(`Error analyzing document: ${error.message}`);
      }

      setProcessingProgress(100);
      
      setDebugData(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          response: "Successfully received analysis data"
        }
      }));

      if (!data || !data.analysis) {
        throw new Error("Invalid response from the analyzer service");
      }

      // Set the analysis results
      setAnalysisResults(data.analysis);
      
      // Move to the results step
      setStep(STEPS.RESULTS);
      
      toast({
        title: "Analysis complete",
        description: "Your lease has been successfully analyzed!",
      });
    } catch (error) {
      console.error("Error analyzing lease document:", error);
      
      setDebugData(prev => ({
        ...prev,
        rawErrorResponse: error instanceof Error ? error.message : String(error),
        additionalInfo: {
          ...prev.additionalInfo,
          errorStack: error instanceof Error ? error.stack : undefined
        }
      }));
      
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your document. Please try again.",
        variant: "destructive"
      });
      setStep(STEPS.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAnalysis = () => {
    setSelectedFile(null);
    setAnalysisResults(null);
    setStep(STEPS.UPLOAD);
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const renderUploadStep = () => (
    <Card className="border-cyan-400/30 bg-cyan-950/20 mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-cyan-400">Upload Lease Document</CardTitle>
            <CardDescription>
              We accept PDF files up to 10MB in size
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleDebugInfo}
            className="text-xs"
          >
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid w-full items-center gap-4">
            <Label htmlFor="lease-file" className="text-cyan-400">
              Select PDF File
            </Label>
            <Input 
              id="lease-file"
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
              disabled={isProcessing}
            />
          </div>
          
          {selectedFile && (
            <div>
              <p className="text-sm text-cyan-100/90 mb-2">
                Selected file: <span className="font-medium">{selectedFile.name}</span>
              </p>
              <Button 
                onClick={handleAnalyzeDocument} 
                disabled={isProcessing}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isProcessing ? "Processing..." : "Analyze Lease"}
              </Button>
            </div>
          )}
          
          <DebugInfo 
            showDebugInfo={showDebugInfo}
            httpStatus={debugData.httpStatus}
            requestStartTime={debugData.requestStartTime}
            requestEndTime={debugData.requestEndTime}
            rawErrorResponse={debugData.rawErrorResponse}
            additionalInfo={debugData.additionalInfo}
          />
          
          <div className="bg-cyan-950/40 p-4 rounded-md">
            <h3 className="text-sm font-medium text-cyan-400 mb-2">Privacy Notice</h3>
            <p className="text-xs text-cyan-100/70">
              Your lease document will be processed to extract relevant information. 
              The document is not stored permanently and is only used for analysis purposes.
              We use Google Document AI and OpenAI to process and analyze your document.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingStep = () => (
    <Card className="border-cyan-400/30 bg-cyan-950/20 mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-cyan-400">Analyzing Your Lease</CardTitle>
            <CardDescription>
              Please wait while we process your document
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleDebugInfo}
            className="text-xs"
          >
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mb-4" />
          <p className="text-cyan-100/80 text-lg font-medium">
            {processingProgress < 30 ? "Extracting text from document..." :
             processingProgress < 60 ? "Analyzing document structure..." :
             processingProgress < 90 ? "Identifying key lease terms..." :
             "Finalizing analysis..."}
          </p>
          <div className="w-full max-w-md mt-6">
            <Progress value={processingProgress} className="h-2 bg-cyan-950/60" />
            <p className="text-right text-xs text-cyan-100/60 mt-2">{processingProgress}%</p>
          </div>
        </div>
        
        <DebugInfo 
          showDebugInfo={showDebugInfo}
          httpStatus={debugData.httpStatus}
          requestStartTime={debugData.requestStartTime}
          requestEndTime={debugData.requestEndTime}
          rawErrorResponse={debugData.rawErrorResponse}
          additionalInfo={debugData.additionalInfo}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">Lease Analyzer</h1>
      <p className="text-cyan-100/80 mb-8">
        Upload your lease agreement to get an AI-powered analysis that explains your
        lease terms in plain language and identifies important clauses.
      </p>
      
      {step === STEPS.UPLOAD && renderUploadStep()}
      {step === STEPS.PROCESSING && renderProcessingStep()}
      {step === STEPS.RESULTS && analysisResults && (
        <Card className="border-cyan-400/30 bg-cyan-950/20 mb-8">
          <LeaseResultsView analysis={analysisResults} onAnalyzeAnother={handleResetAnalysis} />
        </Card>
      )}
      
      {step === STEPS.UPLOAD && (
        <Card className="border-cyan-400/30 bg-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-cyan-400">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-cyan-950/40 rounded-lg text-center">
                <div className="bg-cyan-800/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-cyan-400 font-bold">1</span>
                </div>
                <h3 className="text-cyan-400 mb-2">Upload</h3>
                <p className="text-sm text-cyan-100/80">
                  Upload your lease document in PDF format
                </p>
              </div>
              
              <div className="p-4 bg-cyan-950/40 rounded-lg text-center">
                <div className="bg-cyan-800/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-cyan-400 font-bold">2</span>
                </div>
                <h3 className="text-cyan-400 mb-2">AI Analysis</h3>
                <p className="text-sm text-cyan-100/80">
                  Our AI analyzes the document using Google Document AI and OpenAI
                </p>
              </div>
              
              <div className="p-4 bg-cyan-950/40 rounded-lg text-center">
                <div className="bg-cyan-800/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-cyan-400 font-bold">3</span>
                </div>
                <h3 className="text-cyan-400 mb-2">Review</h3>
                <p className="text-sm text-cyan-100/80">
                  Get a breakdown of your lease with explanations of complex terms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
