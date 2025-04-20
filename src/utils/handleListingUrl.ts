
import { ChatMessage } from "@/utils/types";

export async function handleListingUrl(
  text: string,
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  if (!urlRegex.test(text)) return false;

  try {
    console.log('Analyzing listing URL:', text);
    const resp = await fetch("/api/listing-analyzer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: text })
    });

    if (!resp.ok) {
      console.error('Listing analyzer error:', await resp.text());
      return false;
    }

    const analysis = await resp.json();
    console.log('Listing analysis:', analysis);
    
    setMessages(prev => [
      ...prev,
      { 
        id: crypto.randomUUID(), 
        type: "agent", 
        text: summaryFrom(analysis), 
        timestamp: new Date() 
      }
    ]);
    return true;
  } catch (error) {
    console.error('Error analyzing listing:', error);
    return false;
  }
}

function summaryFrom(a: any) {
  if (!a.address) return "⚠️ I couldn't read that listing. Try another link.";
  return `🔎 ${a.address}\nRent: $${a.rent} | Beds: ${a.beds}\nMarket avg: $${a.marketAverage ?? "n/a"}\n➡️ This unit looks **${a.verdict}** (${a.deltaPercent ?? "?"}% diff).`;
}
