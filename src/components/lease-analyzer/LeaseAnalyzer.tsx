
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";

export function LeaseAnalyzer() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a PDF smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // For now, just show a success toast
      // We'll implement the actual analysis functionality step by step
      toast({
        title: "File received",
        description: `Successfully uploaded ${selectedFile.name}. Analysis functionality coming soon!`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">Lease Analyzer</h1>
      <p className="text-cyan-100/80 mb-8">
        Upload your lease agreement to get an AI-powered analysis that explains your
        lease terms in plain language and identifies important clauses.
      </p>
      
      <Card className="border-cyan-400/30 bg-cyan-950/20 mb-8">
        <CardHeader>
          <CardTitle className="text-cyan-400">Upload Lease Document</CardTitle>
          <CardDescription>
            We accept PDF files up to 5MB in size
          </CardDescription>
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
              />
            </div>
            
            {selectedFile && (
              <div>
                <p className="text-sm text-cyan-100/90 mb-2">
                  Selected file: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Analyze Lease"}
                </Button>
              </div>
            )}
            
            <div className="bg-cyan-950/40 p-4 rounded-md">
              <h3 className="text-sm font-medium text-cyan-400 mb-2">Privacy Notice</h3>
              <p className="text-xs text-cyan-100/70">
                Your lease document will be processed to extract relevant information. 
                The document is not stored permanently and is only used for analysis purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
              <h3 className="text-cyan-400 mb-2">Process</h3>
              <p className="text-sm text-cyan-100/80">
                Our AI analyzes the document to extract key information
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
    </div>
  );
}
