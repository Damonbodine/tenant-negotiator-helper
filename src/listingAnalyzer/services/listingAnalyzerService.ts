
import { ChatMessage } from "@/shared/types";
import { randomTip } from "@/shared/utils/negotiationTips";
import { toast } from "@/shared/hooks/use-toast";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";

// Define interface for the listing analyzer API response
interface ListingAnalysisResponse {
  error?: string;
  message?: string;
  address?: string;
  rent?: number;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  zipcode?: string;
  marketAverage?: number;
  deltaPercent?: string;
  verdict?: string;
  sourceUrl?: string;
  propertyName?: string;
}

interface AddressAnalysisResponse {
  address: string;
  text: string;
  sources?: string[];
  error?: string;
  message?: string;
}

export async function analyzeListingUrl(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  // Improved regex to better capture real estate platform URLs
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor|hotpads)\.com\/[^\s]+)/i;
  const match = text.match(urlRegex);
  
  if (!match) {
    // Check if text looks like an address and analyze it directly
    if (text.includes(",") || /\d+\s+\w+/.test(text)) {
      return await analyzeAddress(text, addAgentMessage);
    }
    return false;
  }
  
  // Clean the url by trimming and removing trailing punctuation
  const url = match[0].trim().replace(/[.,;!?)\]]+$/, "");
  console.log("Detected listing URL (cleaned):", url);
  
  // Add a loading message
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this listing for you. This may take 15-20 seconds...`,
    timestamp: new Date()
  });

  try {
    console.log("Sending request to listing-analyzer API with URL:", url);
    
    // Call our direct Supabase function instead of using fetch
    const data = await analyzeListingWithSupabase(url);
    
    console.log("Received listing analysis data:", data);
    
    // Handle explicit error response
    if (data.error) {
      throw new Error(data.error);
    }

    // If there's a user-friendly message, use it in case of missing data
    if (data.message && (!data.address || !data.rent)) {
      throw new Error(data.message);
    }

    let analysisText = "";
    if (data.address) {
      // If we have a property name and it's not already part of the address, show it
      const addressLine = data.propertyName && !data.address.includes(data.propertyName) 
        ? `**${data.propertyName}** (${data.address})`
        : `**${data.address}**`;
        
      analysisText = `🔎 ${addressLine}\n\n`;
      
      if (data.rent) {
        analysisText += `💰 Listed rent: **$${data.rent}**\n`;
      }
      
      if (data.beds) {
        analysisText += `🛏️ Beds: **${data.beds}**\n`;
      }
      
      if (data.baths) {
        analysisText += `🚿 Baths: **${data.baths}**\n`;
      }
      
      if (data.sqft) {
        analysisText += `📏 Square feet: **${data.sqft}**\n\n`;
      }
      
      if (data.marketAverage) {
        analysisText += `📊 Market average: **$${data.marketAverage}**/month\n`;
        analysisText += `📈 Difference: **${data.deltaPercent}%** (${data.verdict})\n\n`;
      }
      
      analysisText += `---\n💡 **Negotiation tip:** ${randomTip()}`;
    } else {
      throw new Error("I couldn't extract all the details from that listing. Try using another link or provide the property details manually.");
    }

    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: analysisText,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error analyzing listing:", error);
    
    toast({
      title: "Error analyzing listing",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: error instanceof Error 
        ? `⚠️ ${error.message}`
        : "⚠️ I encountered an error while analyzing that listing. Please try again with a URL from Apartments.com or Realtor.com instead.",
      timestamp: new Date()
    });
    
    return true; // Still return true so we don't process this as a regular message
  }
}

export async function analyzeAddress(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  // Add a loading message
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this address for you. This may take 15-20 seconds...`,
    timestamp: new Date()
  });

  try {
    console.log("Sending request to address-analyzer API with text:", text);
    
    // Call our Supabase function to analyze the address
    const data = await analyzeAddressWithSupabase({ address: text });
    
    console.log("Received address analysis data:", data);
    
    // Handle explicit error response
    if (data.error) {
      throw new Error(data.error);
    }

    // Format the analysis response
    let analysisText = `🔎 **Analysis for ${data.address}**\n\n`;
    
    // Add the full text response from the AI (containing all the structured data)
    analysisText += data.text;
    
    // Add a negotiation tip
    analysisText += `\n\n---\n💡 **Negotiation tip:** ${randomTip()}`;

    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: analysisText,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error analyzing address:", error);
    
    toast({
      title: "Error analyzing address",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: error instanceof Error 
        ? `⚠️ ${error.message}`
        : "⚠️ I encountered an error while analyzing that address. Please try with a more specific address including city and state.",
      timestamp: new Date()
    });
    
    return true; // Still return true so we don't process this as a regular message
  }
}
