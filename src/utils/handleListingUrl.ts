
import { ChatMessage } from "@/utils/types";
import { randomTip } from "@/utils/negotiationTips";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";
import { AddressAnalysisRequest } from "@/shared/types/analyzer";

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
    let structuredSummary = data.propertyName ? 
      `🔎 **${data.propertyName}** (${addressToAnalyze})` :
      `🔎 **${addressToAnalyze}**`;
    
    // Add any additional structured data if available
    if (data.rent) structuredSummary += `\n\n💰 Listed rent: **$${data.rent}**`;
    if (data.beds) structuredSummary += `\n🛏️ Beds: **${data.beds}**`;
    if (data.baths) structuredSummary += `\n🚿 Baths: **${data.baths}**`;
    if (data.sqft) structuredSummary += `\n📏 Square feet: **${data.sqft}**`;
    
    if (data.marketAverage && data.deltaPercent && data.verdict) {
      structuredSummary += `\n\n📊 Market average: **$${data.marketAverage}**`;
      structuredSummary += `\n📈 Price difference: **${data.deltaPercent}%** (${data.verdict})`;
    }

    // Pass complete property details to the address analyzer
    const propertyDetails: AddressAnalysisRequest = {
      address: addressToAnalyze,
      propertyDetails: {
        rent: data.rent,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        propertyName: data.propertyName
      }
    };

    console.log("Fetching detailed analysis for address with details:", propertyDetails);
    
    // Send interim message
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: structuredSummary,
      timestamp: new Date()
    });

    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: "Now retrieving detailed market analysis for this area...",
      timestamp: new Date()
    });
    
    try {
      const detailedAnalysis = await analyzeAddressWithSupabase(propertyDetails);
      console.log("Detailed analysis response received:", detailedAnalysis);
      
      if (detailedAnalysis && detailedAnalysis.text && detailedAnalysis.text.length > 10) {
        // We have detailed analysis text
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: detailedAnalysis.text,
          timestamp: new Date()
        });
      } else {
        // Fall back to just a negotiation tip
        console.warn("No detailed analysis text received or text too short.");
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: `💡 **Negotiation tip:** ${randomTip()}`,
          timestamp: new Date()
        });
      }
    } catch (analysisError) {
      console.error("Error getting detailed analysis:", analysisError);
      
      // Still show a negotiation tip if detailed analysis fails
      addAgentMessage({
        id: crypto.randomUUID(),
        type: "agent",
        text: `💡 **Negotiation tip:** ${randomTip()}`,
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
