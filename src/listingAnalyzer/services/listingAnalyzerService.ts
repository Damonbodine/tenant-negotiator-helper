import { ChatMessage } from "@/shared/types";
import { randomTip } from "@/shared/utils/negotiationTips";
import { toast } from "@/shared/hooks/use-toast";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";

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
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor|hotpads)\.com\/[^\s]+)/i;
  const match = text.match(urlRegex);
  
  if (!match) {
    if (text.includes(",") || /\d+\s+\w+/.test(text)) {
      return await analyzeAddress(text, addAgentMessage);
    }
    return false;
  }
  
  const url = match[0].trim().replace(/[.,;!?)\]]+$/, "");
  console.log("Detected listing URL (cleaned):", url);
  
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this listing for you. This may take 15-20 seconds...`,
    timestamp: new Date()
  });

  try {
    console.log("Sending request to listing-analyzer API with URL:", url);
    
    const data = await analyzeListingWithSupabase(url);
    
    console.log("Received listing analysis data:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }

    if (data.message && (!data.address || !data.rent)) {
      throw new Error(data.message);
    }

    let analysisText = "";
    if (data.address) {
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
      
      addAgentMessage({
        id: crypto.randomUUID(),
        type: "agent",
        text: analysisText,
        timestamp: new Date()
      });
      
      try {
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: "Now retrieving detailed market analysis for this area...",
          timestamp: new Date()
        });
        
        console.log("Fetching detailed analysis for address:", data.address);
        const detailedAnalysis = await analyzeAddressWithSupabase({ address: data.address });
        
        if (detailedAnalysis && detailedAnalysis.text && detailedAnalysis.text.length > 10) {
          addAgentMessage({
            id: crypto.randomUUID(),
            type: "agent",
            text: detailedAnalysis.text,
            timestamp: new Date()
          });
        }
      } catch (analysisError) {
        console.error("Error getting detailed analysis:", analysisError);
        
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: `💡 **Negotiation tip:** ${randomTip()}`,
          timestamp: new Date()
        });
      }
    } else {
      throw new Error("I couldn't extract all the details from that listing. Try using another link or provide the property details manually.");
    }

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
    
    return true;
  }
}

export async function analyzeAddress(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this address for you. This may take 15-20 seconds...`,
    timestamp: new Date()
  });

  try {
    console.log("Sending request to address-analyzer API with text:", text);
    
    const data = await analyzeAddressWithSupabase({ address: text });
    
    console.log("Received address analysis data:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }

    let analysisText = `🔎 **Analysis for ${data.address}**\n\n`;
    
    analysisText += data.text;
    
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
    
    return true;
  }
}
