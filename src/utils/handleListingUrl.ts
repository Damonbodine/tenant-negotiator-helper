
import { ChatMessage } from "@/utils/types";
import { randomTip } from "@/utils/negotiationTips";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";

export async function handleListingUrl(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor)\.com\/[^\s]+)/i;
  if (!urlRegex.test(text)) return false;

  const url = text.match(urlRegex)?.[0].trim().replace(/[.,;!?)\]]+$/, "");
  console.log('Detected listing URL (cleaned):', url);
  
  // Add a loading message
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this listing for you. This may take 15-20 seconds...`,
    timestamp: new Date()
  });

  try {
    // First get structured data from listing analyzer
    const data = await analyzeListingWithSupabase(url as string);
    console.log("Listing data received:", data);

    if (!data.address) {
      throw new Error("Could not extract address information from this listing.");
    }

    // Store the address for detailed analysis
    const addressToAnalyze = data.address;
    
    // Prepare a brief structured summary
    let structuredSummary = `🔎 **${addressToAnalyze}**`;
    
    // Add any additional structured data if available
    if (data.rent) structuredSummary += `\n\n💰 Rent: **$${data.rent}**`;
    if (data.beds) structuredSummary += `\n🛏️ Beds: **${data.beds}**`;
    if (data.baths) structuredSummary += `\n🚿 Baths: **${data.baths}**`;
    if (data.sqft) structuredSummary += `\n📏 Area: **${data.sqft} sq ft**`;
    
    if (data.marketAverage && data.deltaPercent && data.verdict) {
      structuredSummary += `\n\n📊 Market average: **$${data.marketAverage}**`;
      structuredSummary += `\n📈 Price difference: **${data.deltaPercent}%** (${data.verdict})`;
    }

    // Now get detailed analysis using the address analyzer
    console.log("Fetching detailed analysis for address:", addressToAnalyze);
    
    try {
      const detailedAnalysis = await analyzeAddressWithSupabase({ address: addressToAnalyze });
      console.log("Detailed analysis response received:", detailedAnalysis);
      
      if (detailedAnalysis && detailedAnalysis.text && detailedAnalysis.text.length > 10) {
        // We have detailed analysis text, combine everything
        const fullAnalysis = `${structuredSummary}\n\n---\n\n${detailedAnalysis.text}\n\n---\n💡 **Negotiation tip:** ${randomTip()}`;
        
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: fullAnalysis,
          timestamp: new Date()
        });
      } else {
        // Fall back to just the structured data with a tip
        console.warn("No detailed analysis text received or text too short.");
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: `${structuredSummary}\n\n---\n💡 **Negotiation tip:** ${randomTip()}`,
          timestamp: new Date()
        });
      }
    } catch (analysisError) {
      console.error("Error getting detailed analysis:", analysisError);
      
      // Still show structured data if detailed analysis fails
      addAgentMessage({
        id: crypto.randomUUID(),
        type: "agent",
        text: `${structuredSummary}\n\n---\n💡 **Negotiation tip:** ${randomTip()}`,
        timestamp: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error analyzing listing:", error);
    
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: error instanceof Error 
        ? `⚠️ ${error.message}`
        : "⚠️ I encountered an error while analyzing that listing. Please try again later.",
      timestamp: new Date()
    });
    
    return true;
  }
}
