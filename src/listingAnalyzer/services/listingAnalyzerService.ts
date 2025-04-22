
import { ChatMessage } from "@/shared/types";
import { randomTip } from "@/shared/utils/negotiationTips";
import { toast } from "@/shared/hooks/use-toast";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";

// Define interface for the listing analyzer API response
interface ListingAnalysisResponse {
  error?: string;
  address?: string;
  rent?: number;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  zipcode?: string;
  marketAverage?: number;
  deltaPercent?: string;
  verdict?: string;
}

export async function analyzeListingUrl(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  // Improved regex to better capture real estate platform URLs
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor)\.com\/[^\s]+)/i;
  const match = text.match(urlRegex);
  
  if (!match) return false;
  
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

    let analysisText = "";
    if (data.address) {
      analysisText = `🔎 **${data.address}**\n\n`;
      
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
      analysisText = "⚠️ I couldn't extract all the details from that listing. Try using another link or provide the property details manually.";
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
        : "⚠️ I encountered an error while analyzing that listing. Please try again later or provide the property details manually.",
      timestamp: new Date()
    });
    
    return true; // Still return true so we don't process this as a regular message
  }
}
