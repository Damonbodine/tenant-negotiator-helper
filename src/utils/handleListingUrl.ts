
import { ChatMessage } from "@/utils/types";
import { randomTip } from "@/utils/negotiationTips";

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
    const resp = await fetch("/api/listing-analyzer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`Error response (${resp.status}):`, errorText);
      throw new Error(`Server responded with ${resp.status}: ${errorText || 'No error details'}`);
    }
    
    const data = await resp.json();

    const summary = data.address
      ? `🔎 ${data.address}\nRent $${data.rent} • Beds ${data.beds}\nMarket avg $${data.marketAverage ?? "n/a"}\n➡️ Looks **${data.verdict}** (${data.deltaPercent ?? "?"}% diff).\n\n---\n💡 Negotiation tip: ${randomTip()}`
      : "⚠️ I couldn't read that listing. Try another link.";

    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: summary,
      timestamp: new Date()
    });
    
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
