// supabase/functions/gemini-chat/index.ts
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "o3";

const completionResp = await fetch(OPENAI_ENDPOINT, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: MODEL,
    messages: [
      { role: "system",  content: finalSystemPrompt },
      ...formattedHistory,
      { role: "user",    content: message }
    ],
    temperature: 0.7,
    max_tokens: 800
  })
});

