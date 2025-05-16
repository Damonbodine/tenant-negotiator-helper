
import { supabase } from "@/integrations/supabase/client";

/**
 * Processes a PDF file using Google Document AI through a Supabase Edge Function
 * @param file The PDF file to process
 * @param onProgress Optional callback for progress updates
 * @returns A promise that resolves to the processed document data
 */
export async function processDocumentWithAI(
  file: File,
  onProgress?: (percent: number, phase: string) => void
): Promise<any> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.type !== 'application/pdf') {
      throw new Error("Only PDF files are supported at this time");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB");
    }

    // Convert file to base64
    const reader = new FileReader();
    const fileBase64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64 = e.target.result.toString().split(',')[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
    
    reader.readAsDataURL(file);
    
    if (onProgress) {
      onProgress(10, "Converting document for processing...");
    }
    
    const fileBase64 = await fileBase64Promise;
    
    if (onProgress) {
      onProgress(30, "Sending document for analysis...");
    }

    console.log("Sending file to lease-analyzer function:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Send to our Supabase Edge Function
    const response = await supabase.functions.invoke('lease-analyzer', {
      body: {
        fileBase64: fileBase64,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }
    });
    
    if (onProgress) {
      onProgress(100, "Analysis complete");
    }
    
    if (response.error) {
      console.error("Error from lease-analyzer function:", response.error);
      throw new Error(response.error.message || "Error processing document");
    }
    
    console.log("Received response from lease-analyzer function");
    
    return response.data;
  } catch (error) {
    console.error("Error in document processing:", error);
    throw error;
  }
}
