import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { knowledgeBaseService, ExternalSource } from "@/utils/knowledgeBase";

interface BulkSourceUploadProps {
  onSourcesAdded: () => void;
}

export const BulkSourceUpload = ({ onSourcesAdded }: BulkSourceUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setErrors([]);
    } else {
      setFile(null);
      setErrors(["Please select a valid CSV file"]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setErrors([]);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        
        // Remove header row
        lines.shift();
        
        const newErrors: string[] = [];
        const sources: Array<Omit<ExternalSource, "id" | "status">> = [];
        
        lines.forEach((line, index) => {
          if (!line.trim()) return;
          
          const values = line.split(",").map(val => val.trim());
          
          if (values.length < 3) {
            newErrors.push(`Line ${index + 2}: Missing required fields`);
            return;
          }
          
          const [name, url, type, description] = values;
          
          if (!name || !url || !type) {
            newErrors.push(`Line ${index + 2}: Name, URL, and Type are required`);
            return;
          }
          
          if (type !== "website" && type !== "marketData") {
            newErrors.push(`Line ${index + 2}: Type must be "website" or "marketData"`);
            return;
          }
          
          sources.push({
            name,
            url,
            type: type as "website" | "marketData",
            description: description || undefined
          });
        });
        
        if (newErrors.length > 0) {
          setErrors(newErrors);
          setIsUploading(false);
          return;
        }
        
        // Add sources to knowledge base
        sources.forEach(source => {
          knowledgeBaseService.addSource(source);
        });
        
        // Reset file input
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        toast({
          title: "Sources Added",
          description: `Successfully added ${sources.length} sources to the knowledge base.`
        });
        
        onSourcesAdded();
      };
      
      reader.readAsText(file);
    } catch (error) {
      setErrors(["An error occurred while processing the file"]);
      console.error("Error processing CSV:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClear = () => {
    setFile(null);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const downloadTemplate = () => {
    const template = "Name,URL,Type,Description\nExample Site,https://example.com,website,An example website\nRent Data,https://rentdata.org,marketData,Source of rental market data";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "source_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Bulk Upload Sources</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadTemplate}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="flex-1"
          />
          {file && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {file && (
          <div className="text-sm text-muted-foreground">
            Selected file: {file.name}
          </div>
        )}
        
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Processing..." : "Upload Sources"}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p>Upload a CSV file with the following columns:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Name (required): Name of the source</li>
            <li>URL (required): URL of the source</li>
            <li>Type (required): "website" or "marketData"</li>
            <li>Description (optional): Brief description of the source</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
