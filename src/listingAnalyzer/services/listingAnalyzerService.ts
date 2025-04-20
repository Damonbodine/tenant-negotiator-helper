
import { ChatMessage } from "@/shared/types";
import { randomTip } from "@/shared/utils/negotiationTips";
import { toast } from "@/shared/hooks/use-toast";

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
    console.log("Sending request to listing-analyzer with URL:", url);
    
    const resp = await fetch('/api/listing-analyzer', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    
    console.log("Received response status:", resp.status);
    
    // Safely get response text first
    let responseText;
    try {
      responseText = await resp.text();
      console.log("Raw response text:", responseText);
    } catch (e) {
      console.error("Error reading response text:", e);
      throw new Error("Failed to read response from server");
    }
    
    // Only parse JSON if we have content
    let data = {};
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid JSON response from listing analyzer");
      }
    } else {
      console.error("Empty response received from server");
      throw new Error("No data received from listing analyzer");
    }
    
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
