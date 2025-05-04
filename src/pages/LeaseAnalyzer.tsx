
import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LeaseAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<null | {
    summary: string;
    complexTerms: Array<{ term: string; explanation: string }>;
    unusualClauses: Array<{ clause: string; concern: string }>;
    questions: string[];
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && 
          selectedFile.type !== 'application/msword' && 
          selectedFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
          selectedFile.type !== 'text/plain') {
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: "Please upload a PDF, DOC, DOCX, or TXT file.",
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

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    try {
      // For now, we'll just simulate the analysis with a timeout
      // In a real implementation, this would call a Supabase edge function to process the file
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response - in a real implementation this would come from the backend
      setAnalysisResults({
        summary: "This is a standard 12-month residential lease agreement with some notable clauses regarding security deposit, maintenance responsibilities, and early termination options.",
        complexTerms: [
          { 
            term: "Indemnification Clause (Section 14)", 
            explanation: "This clause requires you (the tenant) to protect the landlord from legal responsibility for damages or injuries that occur in the rental property, even if not directly caused by you."
          },
          { 
            term: "Joint and Several Liability (Section 8)", 
            explanation: "If you have roommates, this means each person is individually responsible for the full rent and all obligations in the lease. If one roommate doesn't pay, the others must cover their share."
          },
          {
            term: "Automatical Renewal (Section 22)",
            explanation: "Your lease will automatically renew unless you provide written notice before the deadline specified. This means you could be locked into another term if you forget to give notice."
          }
        ],
        unusualClauses: [
          {
            clause: "Excessive Late Fee (Section 4)",
            concern: "The late fee of 10% of monthly rent exceeds what's typical in most jurisdictions (usually 5% or a flat fee)."
          },
          {
            clause: "24-Hour Entry Right (Section 17)",
            concern: "The landlord claims right to enter with only 24 hours notice. Many states require 48-72 hours notice except in emergencies."
          }
        ],
        questions: [
          "Can the automatic renewal clause be modified to require mutual agreement?",
          "Is the 10% late fee negotiable to align with standard practices?",
          "Can the entry notice period be extended to 48 hours?",
          "What specific maintenance tasks am I responsible for versus the landlord?",
          "Are there any restrictions on guest stays that aren't clearly defined?"
        ]
      });
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

      {!analysisResults ? (
        <Card className="border-cyan-400/30 bg-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-cyan-400">Upload Your Lease Document</CardTitle>
            <CardDescription>
              We accept PDF, DOC, DOCX, and TXT files up to 10MB
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
                accept=".pdf,.doc,.docx,.txt"
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
