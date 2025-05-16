
import { supabase } from "@/integrations/supabase/client";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second between retries

/**
 * Wait for a specified amount of time
 * @param ms Time to wait in milliseconds
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function multiple times with exponential backoff
 * @param fn Function to retry
 * @param retries Maximum number of retries
 * @param delayMs Delay between retries in milliseconds
 * @returns Promise that resolves to the function result
 */
async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delayMs = RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Retrying after error: ${error.message}, ${retries} retries left`);
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs * 1.5); // Exponential backoff
  }
}

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

    // Try direct function invocation first with retry logic
    try {
      if (onProgress) {
        onProgress(40, "Attempting direct function invocation...");
      }
      
      // Use retry logic for more resilience
      const response = await retry(async () => {
        return await supabase.functions.invoke('lease-analyzer', {
          body: {
            testMode: false,
            fileBase64: fileBase64,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            debug: true
          },
          headers: {
            'x-debug': 'true'
          }
        });
      });
      
      console.log("Response from lease-analyzer function:", response);
      
      if (onProgress) {
        onProgress(100, "Analysis complete");
      }
      
      if (response.error) {
        console.error("Error from lease-analyzer function:", response.error);
        const errorMessage = response.error.message || "Error processing document";
        const errorDetails = response.error.details || {};
        throw new Error(`${errorMessage}. Details: ${JSON.stringify(errorDetails)}`);
      }
      
      console.log("Received response from lease-analyzer function");
      return response.data;
    } catch (error) {
      console.error("Error in document processing:", error);
      throw error;
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
    
    // Use retry logic for more resilience
    const response = await retry(async () => {
      return await supabase.functions.invoke('lease-analyzer', {
        body: {
          testMode: true,
          fileName: "test.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          debug: true
        },
        headers: {
          'x-debug': 'true'
        }
      });
    });
    
    console.log("Test mode response:", response);
    
    if (response.error) {
      console.error("Test mode error:", response.error);
      const errorMessage = response.error.message || "Error in test mode";
      const errorDetails = response.error.details || {};
      throw new Error(`${errorMessage}. Details: ${JSON.stringify(errorDetails)}`);
    }
    
    console.log("Test completed successfully:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error in test mode:", error);
    throw error;
  }
}
