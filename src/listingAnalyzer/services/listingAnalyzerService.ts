
import { ChatMessage } from "@/shared/types";
import { randomTip } from "@/shared/utils/negotiationTips";

export async function analyzeListingUrl(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  if (!urlRegex.test(text)) return false;

  try {
    const resp = await fetch("/api/listing-analyzer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: text })
    });
    
    if (!resp.ok) {
      throw new Error(`Error analyzing listing: ${resp.statusText}`);
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
      text: "⚠️ I encountered an error while analyzing that listing. Please try again later.",
      timestamp: new Date()
    });
    return true;
  }
}
