
import { supabase } from "@/integrations/supabase/client";
import { getApiKey } from "@/utils/keyManager";

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
    
    // Get the API keys from localStorage to include with the request
    const googleApiKey = await getApiKey("GOOGLE_DOCUMENTAI_API_KEY");
    const openaiApiKey = await getApiKey("OPENAI_RENTERS_MENTOR_KEY");

    // Send to our Supabase Edge Function
    const response = await supabase.functions.invoke('lease-analyzer', {
      body: {
        fileBase64: fileBase64,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        clientApiKeys: {
          // Only sending indicators that keys exist, not the actual keys
          // The actual keys are stored in Supabase secrets
          googleApiKeyProvided: !!googleApiKey,
          openaiApiKeyProvided: !!openaiApiKey
        }
      }
    });
    
    if (onProgress) {
      onProgress(100, "Analysis complete");
    }
    
    if (response.error) {
      console.error("Error from lease-analyzer function:", response.error);
      throw new Error(response.error.message || "Error processing document");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error in document processing:", error);
    throw error;
  }
}
