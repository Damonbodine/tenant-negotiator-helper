const urlRegex = /(https?:\/\/[^\s]+)/;
// inside handleSendMessage
if (urlRegex.test(userMessage.text)) {
  const resp = await fetch("/api/listing-analyzer", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ url: userMessage.text })
  });
  const analysis = await resp.json();
  setMessages(prev => [...prev, { ...agentMessage, text: analysis.summary }]);
  return;
}
