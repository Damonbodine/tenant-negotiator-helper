
import { ChatMessage } from "@/utils/types";
import { randomTip } from "@/utils/negotiationTips";

export async function handleListingUrl(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  const urlRegex = /(https?:\/\/[^\s]+)/;
  if (!urlRegex.test(text)) return false;

  const resp = await fetch("/api/listing-analyzer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: text })
  });
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
}
