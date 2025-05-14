import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { LeaseResultsView } from "./LeaseResultsView";

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

export function LeaseAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file);
    } else {
      alert("Please upload a PDF under 10MB.");
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) return;

    setStep(STEPS.PROCESSING);

    const arrayBuffer = await selectedFile.arrayBuffer();
    const base64String = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const { data, error } = await supabase.functions.invoke('document-ai-lease-analyzer', {
      body: { fileBase64: base64String, fileName: selectedFile.name }
    });

    if (error) {
      console.error(error);
      alert('Analysis failed.');
      setStep(STEPS.UPLOAD);
      return;
    }

    setAnalysisResults(data);
    setStep(STEPS.RESULTS);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep(STEPS.UPLOAD);
    setAnalysisResults(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Lease Analyzer</h1>
      {step === STEPS.UPLOAD && (
        <div className="space-y-6">
          <Input type="file" accept="application/pdf" onChange={handleFileChange} />
          {selectedFile && (
            <Button onClick={handleAnalyzeDocument}>Analyze Lease</Button>
          )}
        </div>
      )}
      {step === STEPS.PROCESSING && (
        <div>Processing your document...</div>
      )}
      {step === STEPS.RESULTS && analysisResults && (
        <LeaseResultsView analysis={analysisResults} onAnalyzeAnother={handleReset} />
      )}
    </div>
  );
}

