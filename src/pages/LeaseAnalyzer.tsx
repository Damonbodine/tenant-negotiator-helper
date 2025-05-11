import { useState, useRef, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Shield, Link as LinkIcon, Calendar, BarChart3, FileBarChart, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
import { LeaseFinancialSection } from "@/components/lease-analyzer/LeaseFinancialSection";
import { LeaseTermSection } from "@/components/lease-analyzer/LeaseTermSection";
import { LeaseSummarySection } from "@/components/lease-analyzer/LeaseSummarySection";
import { LeasePartiesSection } from "@/components/lease-analyzer/LeasePartiesSection";
import { LeasePropertySection } from "@/components/lease-analyzer/LeasePropertySection";
import { LeaseResponsibilitiesSection } from "@/components/lease-analyzer/LeaseResponsibilitiesSection";
import { LeaseCriticalDatesSection } from "@/components/lease-analyzer/LeaseCriticalDatesSection";
import { LeaseVerificationSection } from "@/components/lease-analyzer/LeaseVerificationSection";

// Define the types for the analysis results
interface LateFee {
  amount: number;
  gracePeriod: number;
  type: string;
}

interface OtherFee {
  type: string;
  amount: number;
  frequency: string;
}

interface Rent {
  amount: number;
  frequency: string;
}

interface Utilities {
  included: string[];
  tenant: string[];
}

interface Financial {
  rent: Rent;
  securityDeposit: number;
  lateFee: LateFee;
  utilities: Utilities;
  otherFees: OtherFee[];
}

interface EarlyTermination {
  allowed: boolean;
  fee: string;
}

interface Term {
  start: string;
  end: string;
  durationMonths: number;
  renewalType: string;
  renewalNoticeDays: number;
  earlyTermination: EarlyTermination;
}

interface Parties {
  landlord: string;
  tenants: string[];
  jointAndSeveralLiability: boolean;
}

interface Property {
  address: string;
  type: string;
  amenities: string[];
  furnishings: string[];
}

interface Maintenance {
  landlord: string[];
  tenant: string[];
}

interface UtilityResponsibilities {
  landlord: string[];
  tenant: string[];
}

interface Insurance {
  requiredForTenant: boolean;
  minimumCoverage: string;
}

interface Responsibilities {
  maintenance: Maintenance;
  utilities: UtilityResponsibilities;
  insurance: Insurance;
}

interface CriticalDate {
  label: string;
  date: string;
}

interface ExtractedData {
  financial: Financial;
  term: Term;
  parties: Parties;
  property: Property;
  responsibilities: Responsibilities;
  criticalDates: CriticalDate[];
}

interface ComplexTerm {
  term: string;
  explanation: string;
}

interface UnusualClause {
  clause: string;
  concern: string;
  riskLevel?: "high" | "medium" | "low";
}

interface ExtractionConfidence {
  rent: "high" | "medium" | "low";
  securityDeposit: "high" | "medium" | "low";
  lateFee: "high" | "medium" | "low";
  term: "high" | "medium" | "low";
  utilities: "high" | "medium" | "low";
}

interface RegexFindings {
  potentialRentValues: number[] | null;
  potentialDepositValues: number[] | null;
  potentialTenants: string[] | null;
}

interface AnalysisResults {
  summary: string;
  complexTerms: ComplexTerm[];
  unusualClauses: UnusualClause[];
  questions: string[];
  extractedData?: ExtractedData;
  extractionConfidence?: ExtractionConfidence;
  regexFindings?: RegexFindings;
  rentVerificationNeeded?: boolean;
  alternativeRentValues?: number[];
  regexRentValues?: number[];
}

const LeaseAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Remove API key related state variables - now managed in Supabase edge function secrets
  const [processingProgress, setProcessingProgress] = useState<string | null>(null);

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
      // Accept PDF, DOC, DOCX, TXT, JPG, and PNG files
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
          droppedFile.type !== 'text/plain' &&
          droppedFile.type !== 'image/jpeg' &&
          droppedFile.type !== 'image/png') {
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: "Please upload a PDF, DOC, DOCX, TXT, JPG, or PNG file.",
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

  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>({});

  const handleVerificationUpdate = (field: string, value: any) => {
    console.log("Verification update for field:", field, "with value:", value);
    setVerifiedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVerificationComplete = () => {
    if (verifiedData && analysisResults) {
      console.log("Applying verified data:", verifiedData);
      
      // Create a deep copy to avoid reference issues
      const updatedResults = JSON.parse(JSON.stringify(analysisResults));
      
      // Apply verified financial data
      if (verifiedData.financial) {
        if (!updatedResults.extractedData) {
          updatedResults.extractedData = {};
        }
        
        if (!updatedResults.extractedData.financial) {
          updatedResults.extractedData.financial = {};
        }
        
        // Merge verified financial data 
        updatedResults.extractedData.financial = {
          ...updatedResults.extractedData.financial,
          ...verifiedData.financial
        };
        
        // Update confidence to high since user verified the data
        if (!updatedResults.extractionConfidence) {
          updatedResults.extractionConfidence = {};
        }
        
        if (verifiedData.financial.rent) {
          updatedResults.extractionConfidence.rent = "high";
        }
        
        if (verifiedData.financial.securityDeposit) {
          updatedResults.extractionConfidence.securityDeposit = "high";
        }
      }
      
      console.log("Updated analysis with verified data:", updatedResults);
      setAnalysisResults(updatedResults);
      setVerificationRequired(false);
      
      // Show confirmation toast
      toast({
        title: "Verification complete",
        description: "Your verified information has been applied to the analysis.",
        variant: "default",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setProcessingProgress("Preparing document");
    setVerifiedData({});
    
    try {
      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64String = reader.result as string;
          const base64Content = base64String.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = error => reject(error);
      });
      
      setProcessingProgress("Processing with Document AI");
      
      // Call the Document AI edge function to process the document
      console.log("Calling document-ai-lease-analyzer function");
      const { data, error } = await supabase.functions.invoke('document-ai-lease-analyzer', {
        body: {
          fileBase64,
          fileName: file.name,
          fileType: file.type
        }
      });

      if (error) {
        console.error("Error calling document-ai-lease-analyzer function:", error);
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: error.message || "We couldn't analyze your lease document. Please try again later.",
        });
        return;
      }

      console.log("Document analysis result:", data);
      setAnalysisResults(data);
      
      // Enhanced verification check
      if (data.rentVerificationNeeded || 
          (data.extractionConfidence && data.extractionConfidence.rent === 'low') || 
          (data.regexRentValues && 
           data.regexRentValues.length > 0 && 
           !data.regexRentValues.includes(data.extractedData?.financial?.rent?.amount))) {
        console.log("Verification needed based on analysis", {
          rentVerificationNeeded: data.rentVerificationNeeded,
          rentConfidence: data.extractionConfidence?.rent,
          regexValues: data.regexRentValues,
          extractedRent: data.extractedData?.financial?.rent?.amount
        });
        setVerificationRequired(true);
      }
      
    } catch (error) {
      console.error("Error analyzing lease:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "We couldn't analyze your lease document. Please try again later.",
      });
    } finally {
      setIsAnalyzing(false);
      setProcessingProgress(null);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysisResults(null);
    setVerifiedData({});
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

      {/* File Upload Card */}
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
                          {processingProgress || "Analyzing with AI..."}
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

          {/* Verification Modal if needed */}
          {verificationRequired && analysisResults && (
            <Dialog open={verificationRequired} onOpenChange={setVerificationRequired}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" /> Please Verify Key Information
                  </DialogTitle>
                  <DialogDescription className="pt-2">
                    We've detected some values that may need verification. Please confirm or correct the information below.
                  </DialogDescription>
                </DialogHeader>
                
                <LeaseVerificationSection 
                  analysisResults={analysisResults}
                  onUpdate={handleVerificationUpdate}
                />

                <DialogFooter className="sm:justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setVerificationRequired(false)}
                  >
                    Skip Verification
                  </Button>
                  <Button 
                    onClick={handleVerificationComplete}
                    className="bg-cyan-400 text-cyan-950 hover:bg-cyan-500"
                  >
                    Confirm & Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full grid grid-cols-7 bg-cyan-950/40">
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> Summary
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" /> Financial
              </TabsTrigger>
              <TabsTrigger value="term" className="flex items-center gap-1">
                <FileBarChart className="h-4 w-4" /> Term
              </TabsTrigger>
              <TabsTrigger value="property" className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Property
              </TabsTrigger>
              <TabsTrigger value="parties" className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Parties
              </TabsTrigger>
              <TabsTrigger value="responsibilities" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Responsibilities
              </TabsTrigger>
              <TabsTrigger value="dates" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Dates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <LeaseSummarySection 
                summary={analysisResults.summary}
                complexTerms={analysisResults.complexTerms}
                unusualClauses={analysisResults.unusualClauses}
                questions={analysisResults.questions}
                confidence={analysisResults.extractionConfidence}
              />
            </TabsContent>

            <TabsContent value="financial">
              {analysisResults.extractedData && 
                <LeaseFinancialSection financial={analysisResults.extractedData.financial} />
              }
            </TabsContent>

            <TabsContent value="term">
              {analysisResults.extractedData && 
                <LeaseTermSection term={analysisResults.extractedData.term} />
              }
            </TabsContent>

            <TabsContent value="property">
              {analysisResults.extractedData && 
                <LeasePropertySection property={analysisResults.extractedData.property} />
              }
            </TabsContent>

            <TabsContent value="parties">
              {analysisResults.extractedData && 
                <LeasePartiesSection parties={analysisResults.extractedData.parties} />
              }
            </TabsContent>

            <TabsContent value="responsibilities">
              {analysisResults.extractedData && 
                <LeaseResponsibilitiesSection responsibilities={analysisResults.extractedData.responsibilities} />
              }
            </TabsContent>

            <TabsContent value="dates">
              {analysisResults.extractedData && 
                <LeaseCriticalDatesSection criticalDates={analysisResults.extractedData.criticalDates} />
              }
            </TabsContent>
          </Tabs>

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

          <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4">
            <p className="text-amber-400 text-sm">
              <strong>Disclaimer:</strong> This analysis is provided for informational purposes only and should not be considered legal advice. 
              We recommend consulting with a qualified attorney before making legal decisions about your lease agreement.
            </p>
          </div>
        </div>
      )}
      
      <div className="text-center mt-8">
        <p className="text-sm text-cyan-400/60">
          Powered by Google Document AI for enhanced document recognition
        </p>
      </div>
    </div>
  );
};

export default LeaseAnalyzer;
