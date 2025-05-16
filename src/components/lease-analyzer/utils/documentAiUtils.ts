
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

    if (onProgress) {
      onProgress(10, "Preparing document for processing...");
    }

    // Create FormData for better file handling
    const formData = new FormData();
    formData.append("file", file);

    if (onProgress) {
      onProgress(20, "Converting document for processing...");
    }
    
    // Convert file to base64 for backward compatibility
    // This approach supports both multipart/form-data and legacy base64 methods
    const reader = new FileReader();
    const fileBase64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64 = e.target.result.toString();
          // Remove data:application/pdf;base64, prefix if it exists
          const base64Content = base64.indexOf('base64,') > -1 
            ? base64.split('base64,')[1] 
            : base64;
          
          resolve(base64Content);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
    
    reader.readAsDataURL(file);
    const fileBase64 = await fileBase64Promise;
    
    if (onProgress) {
      onProgress(30, "Sending document for analysis...");
    }

    console.log("Sending file to lease-analyzer function:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Send to edge function - we'll try using FormData
    // If that fails, we'll fall back to JSON with base64
    try {
      if (onProgress) {
        onProgress(40, "Attempting multipart upload...");
      }
      
      // First try with FormData (preferred method)
      const response = await supabase.functions.invoke('lease-analyzer', {
        body: formData
      });
      
      if (onProgress) {
        onProgress(100, "Analysis complete");
      }
      
      if (response.error) {
        console.error("Error from lease-analyzer function with FormData:", response.error);
        throw new Error(response.error.message || "Error processing document");
      }
      
      console.log("Received response from lease-analyzer function (FormData)");
      return response.data;
    } catch (formDataError) {
      console.log("FormData approach failed, falling back to JSON with base64:", formDataError);
      
      if (onProgress) {
        onProgress(50, "Switching to base64 encoding...");
      }
      
      // Fall back to JSON with base64 approach
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
        console.error("Error from lease-analyzer function with base64:", response.error);
        throw new Error(response.error.message || "Error processing document");
      }
      
      console.log("Received response from lease-analyzer function (base64)");
      return response.data;
    }
  } catch (error) {
    console.error("Error in document processing:", error);
    throw error;
  }
}

/**
 * Run a test to check if the lease analyzer function is working
 * This uses a simplified test approach that doesn't require a real PDF
 * @returns A promise that resolves to the test result
 */
export async function runLeaseAnalyzerTest(): Promise<any> {
  try {
    console.log("Running lease analyzer test mode");
    
    // Send test request to our Supabase Edge Function
    // Use the testMode flag to trigger a simplified response
    const response = await supabase.functions.invoke('lease-analyzer', {
      body: {
        testMode: true,
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileSize: 1024
      }
    });
    
    if (response.error) {
      console.error("Test mode error:", response.error);
      throw new Error(response.error.message || "Error in test mode");
    }
    
    console.log("Test completed successfully:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error in test mode:", error);
    throw error;
  }
}
