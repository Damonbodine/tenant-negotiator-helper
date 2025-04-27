
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

    // Generate initial summary with structured data
    const structuredSummary = data.address
      ? `🔎 ${data.address}\nRent $${data.rent} • Beds ${data.beds}\nMarket avg $${data.marketAverage ?? "n/a"}\n➡️ Looks **${data.verdict}** (${data.deltaPercent ?? "?"}% diff)`
      : "⚠️ I couldn't read that listing's basic details.";

    // Now get detailed analysis using the address analyzer
    if (data.address) {
      try {
        const detailedAnalysis = await analyzeAddressWithSupabase({ address: data.address });
        
        // Combine structured summary with detailed analysis
        const fullAnalysis = `${structuredSummary}\n\n---\n\n${detailedAnalysis.text}\n\n---\n💡 Negotiation tip: ${randomTip()}`;
        
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: fullAnalysis,
          timestamp: new Date()
        });
      } catch (analysisError) {
        // If detailed analysis fails, still show structured data
        console.error("Error getting detailed analysis:", analysisError);
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: `${structuredSummary}\n\n---\n💡 Negotiation tip: ${randomTip()}`,
          timestamp: new Date()
        });
      }
    } else {
      // Fallback to just showing structured summary
      addAgentMessage({
        id: crypto.randomUUID(),
        type: "agent",
        text: structuredSummary,
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
