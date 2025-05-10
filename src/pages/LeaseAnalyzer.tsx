
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Shield, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

const LeaseAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<null | {
    summary: string;
    complexTerms: Array<{ term: string; explanation: string }>;
    unusualClauses: Array<{ clause: string; concern: string }>;
    questions: string[];
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if disclaimer has been seen when component mounts
  useEffect(() => {
    const disclaimerSeen = localStorage.getItem('leaseDisclaimerSeen') === 'true';
    if (!disclaimerSeen) {
      setDisclaimerOpen(true);
    }
  }, []);

  // Function to handle disclaimer acknowledgment
  const handleDisclaimerAcknowledged = () => {
    localStorage.setItem('leaseDisclaimerSeen', 'true');
    setDisclaimerOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    
    if (selectedFile) {
      // Updated to accept PDF, DOC, DOCX, TXT, JPG, and PNG files
      if (selectedFile.type !== 'application/pdf' && 
          selectedFile.type !== 'application/msword' && 
          selectedFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
          selectedFile.type !== 'text/plain' &&
          selectedFile.type !== 'image/jpeg' &&
          selectedFile.type !== 'image/png') {
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: "Please upload a PDF, DOC, DOCX, TXT, JPG, or PNG file.",
        });
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf' && 
          droppedFile.type !== 'application/msword' && 
          droppedFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
          droppedFile.type !== 'text/plain') {
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: "Please upload a PDF, DOC, DOCX, or TXT file.",
        });
        return;
      }
      
      if (droppedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
        });
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For plain text files, just read the text
    if (file.type === 'text/plain') {
      return await file.text();
    }

    // For image files, we would need OCR in a production app
    if (file.type === 'image/jpeg' || file.type === 'image/png') {
      // In a production app, we'd implement OCR here
      // For now, we'll return a message about this limitation
      return `[This is image content from ${file.name}. In a production app, we would use OCR to extract text from this image.]`;
    }

    // For other file types (PDF, DOC, DOCX) we would need to use a dedicated library
    // or service to extract text. For simplicity in this prototype, we'll just read the 
    // first few KB as text and add a note about proper extraction
    
    const text = await file.text();
    return `${text.slice(0, 10000)}... 
    [Note: This is a simplified text extraction from a ${file.type} file. 
    In a production application, we would use proper document parsing libraries or services.]`;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    try {
      // Extract text from the file
      const documentText = await extractTextFromFile(file);
      
      // Call the Supabase edge function to analyze the document
      const { data, error } = await supabase.functions.invoke('lease-analyzer', {
        body: {
          documentText,
          documentType: file.type,
          fileName: file.name
        }
      });

      if (error) {
        console.error("Error calling lease-analyzer function:", error);
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: error.message || "We couldn't analyze your lease document. Please try again later.",
        });
        return;
      }

      console.log("Lease analysis result:", data);
      setAnalysisResults(data);
      
    } catch (error) {
      console.error("Error analyzing lease:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "We couldn't analyze your lease document. Please try again later.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysisResults(null);
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center gradient-heading">Lease Document Analyzer</h1>
      <p className="text-xl text-cyan-400/90 text-center mb-8">
        Upload your lease to get plain-language explanations and spot potential issues
      </p>

      {/* Disclaimer Modal */}
      <Dialog open={disclaimerOpen} onOpenChange={setDisclaimerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" /> Quick heads-up!
            </DialogTitle>
            <DialogDescription className="pt-2">
              Renters Mentor is an educational tool. We are <strong>not attorneys or a licensed real-estate broker</strong>. 
              Nothing here is legal advice. Consult a qualified professional before acting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleDisclaimerAcknowledged}>
              I understand, continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!analysisResults ? (
        <Card className="border-cyan-400/30 bg-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-cyan-400">Upload Your Lease Document</CardTitle>
            <CardDescription>
              We accept PDF, DOC, DOCX, TXT, JPG, and PNG files up to 10MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-10 text-center ${file ? 'border-cyan-400/50 bg-cyan-950/30' : 'border-cyan-400/20'}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="hidden"
              />
              
              {!file ? (
                <div>
                  <Upload className="h-12 w-12 mx-auto text-cyan-400 mb-4" />
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">
                    Drag and drop your lease document here
                  </h3>
                  <p className="text-cyan-400/70 mb-6">
                    Or click the button below to browse files
                  </p>
                  <Button 
                    onClick={triggerFileInput}
                    className="bg-cyan-400 text-cyan-950 hover:bg-cyan-500"
                  >
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div>
                  <FileText className="h-12 w-12 mx-auto text-cyan-400 mb-4" />
                  <h3 className="text-lg font-medium text-cyan-400 mb-2">
                    {file.name}
                  </h3>
                  <p className="text-cyan-400/70 mb-6">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={resetAnalysis}
                      variant="outline"
                      className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-950/40"
                    >
                      Remove
                    </Button>
                    <Button 
                      onClick={handleAnalyze}
                      className="bg-cyan-400 text-cyan-950 hover:bg-cyan-500"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyan-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </>
                      ) : "Analyze Document"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-cyan-400">Analysis Results</h2>
            <Button 
              onClick={resetAnalysis}
              variant="outline"
              className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-950/40"
            >
              Analyze Another Document
            </Button>
          </div>

          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyan-100/90">{analysisResults.summary}</p>
            </CardContent>
          </Card>

          {/* Link to Voice Practice */}
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <LinkIcon className="h-5 w-5" /> Practice Negotiating Your Lease
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyan-100/90 mb-4">
                Want to practice discussing these terms with your landlord? Use our voice practice tool to 
                rehearse important conversations about your lease.
              </p>
              <div className="flex justify-start">
                <Button asChild className="bg-cyan-400 text-cyan-950 hover:bg-cyan-500">
                  <Link to="/practice/voice">
                    Go to Voice Practice
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="complex" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-cyan-950/40">
              <TabsTrigger value="complex">Complex Terms</TabsTrigger>
              <TabsTrigger value="unusual">Unusual Clauses</TabsTrigger>
              <TabsTrigger value="questions">Questions to Ask</TabsTrigger>
            </TabsList>

            <TabsContent value="complex">
              <Card className="border-cyan-400/30 bg-cyan-950/20">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Complex Terms Explained</CardTitle>
                  <CardDescription>Legal jargon translated into plain language</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {analysisResults.complexTerms.map((term, index) => (
                      <li key={index} className="pb-4 border-b border-cyan-400/20 last:border-b-0">
                        <h4 className="font-semibold text-cyan-400 mb-2">{term.term}</h4>
                        <p className="text-cyan-100/90">{term.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unusual">
              <Card className="border-cyan-400/30 bg-cyan-950/20">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Unusual Clauses</CardTitle>
                  <CardDescription>Potentially problematic terms you should review</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {analysisResults.unusualClauses.map((clause, index) => (
                      <li key={index} className="pb-4 border-b border-cyan-400/20 last:border-b-0 flex gap-3">
                        <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-400 mb-2">{clause.clause}</h4>
                          <p className="text-cyan-100/90">{clause.concern}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <Card className="border-cyan-400/30 bg-cyan-950/20">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Questions to Ask</CardTitle>
                  <CardDescription>Consider discussing these points before signing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysisResults.questions.map((question, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                        <p className="text-cyan-100/90">{question}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4">
            <p className="text-amber-400 text-sm">
              <strong>Disclaimer:</strong> This analysis is provided for informational purposes only and should not be considered legal advice. 
              We recommend consulting with a qualified attorney before making legal decisions about your lease agreement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaseAnalyzer;
