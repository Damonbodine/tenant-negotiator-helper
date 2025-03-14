
import { useState } from "react";
import { z } from "zod";
import { ExternalSource, knowledgeBaseService } from "@/utils/knowledgeBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const sourceSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  type: z.enum(["website", "marketData"], { 
    required_error: "Please select a source type" 
  }),
  description: z.string().optional(),
});

type BulkSourceUploadProps = {
  onSourcesAdded: () => void;
  onCancel: () => void;
};

export const BulkSourceUpload = ({ onSourcesAdded, onCancel }: BulkSourceUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors([]);
    }
  };
  
  const processCSV = async (text: string): Promise<{
    sources: Omit<ExternalSource, 'id' | 'status'>[];
    errors: string[];
  }> => {
    const errors: string[] = [];
    const sources: Omit<ExternalSource, 'id' | 'status'>[] = [];
    
    // Split by new lines and remove empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    // Check if we have a header row
    if (lines.length === 0) {
      errors.push("CSV file is empty");
      return { sources, errors };
    }
    
    // Assume first row is header: name,url,type,description
    // Skip header row and process data rows
    for (let i = 1; i < lines.length; i++) {
      setUploadProgress(Math.floor((i / lines.length) * 100));
      
      const line = lines[i];
      // Split by comma, but respect quoted values (for descriptions with commas)
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      
      if (!values || values.length < 3) {
        errors.push(`Line ${i + 1}: Invalid format. Expected at least name, URL, and type.`);
        continue;
      }
      
      // Remove quotes if present
      const cleanValues = values.map(val => val.replace(/^"(.*)"$/, '$1'));
      
      const [name, url, type, ...descriptionParts] = cleanValues;
      const description = descriptionParts.join(',');
      
      // Validate with Zod schema
      try {
        const parsed = sourceSchema.parse({
          name,
          url,
          type: type === 'marketData' || type === 'website' ? type : 'website',
          description
        });
        
        sources.push(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`Line ${i + 1}: ${error.errors.map(e => e.message).join(', ')}`);
        } else {
          errors.push(`Line ${i + 1}: Invalid data`);
        }
      }
    }
    
    return { sources, errors };
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrors([]);
    
    try {
      const text = await file.text();
      const { sources, errors } = await processCSV(text);
      
      if (errors.length > 0) {
        setErrors(errors);
      }
      
      if (sources.length > 0) {
        // Add sources to knowledge base
        let addedCount = 0;
        for (const source of sources) {
          knowledgeBaseService.addSource(source);
          addedCount++;
        }
        
        toast({
          title: "Sources added",
          description: `Successfully added ${addedCount} sources to your knowledge base.`,
        });
        
        if (addedCount > 0) {
          onSourcesAdded();
        }
      } else {
        toast({
          title: "No valid sources",
          description: "No valid sources were found in the CSV file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast({
        title: "Error",
        description: "Failed to process CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };
  
  const downloadTemplate = () => {
    const header = "name,url,type,description";
    const sampleRow1 = "NY Rent Data,https://example.com/rent-data,marketData,\"NYC rent data for 2023, includes historical trends\"";
    const sampleRow2 = "Tenant Rights Website,https://example.com/rights,website,Legal information for tenants";
    
    const csvContent = [header, sampleRow1, sampleRow2].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'source_template.csv');
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bulk Upload Sources</CardTitle>
        <CardDescription>
          Upload a CSV file with multiple knowledge sources.
          The CSV should have columns: name, url, type, description (optional).
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="csvFile">Upload CSV File</Label>
          <Input 
            id="csvFile" 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            Accepted format: CSV with columns for name, URL, type (website/marketData), and description
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            disabled={isUploading}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
        
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              Processing... {uploadProgress}%
            </p>
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="bg-destructive/10 p-3 rounded-md space-y-2">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p className="font-medium">Validation Errors</p>
            </div>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {errors.slice(0, 5).map((error, index) => (
                <li key={index} className="text-destructive">{error}</li>
              ))}
              {errors.length > 5 && (
                <li className="text-destructive">{`And ${errors.length - 5} more errors...`}</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload Sources"}
        </Button>
      </CardFooter>
    </Card>
  );
};
