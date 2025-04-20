
import axios from "axios";

const VOICE_ID = import.meta.env.VITE_ELEVEN_VOICE_ID ?? "Rachel";
const ENDPOINT = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;

export async function speak(text: string) {
  const apiKey = import.meta.env.VITE_ELEVEN_API_KEY;
  if (!apiKey || !text) return;

  const { data } = await axios.post(
    ENDPOINT,
    { text, model_id: "eleven_multilingual_v2" },
    { responseType: "arraybuffer", headers: { "xi-api-key": apiKey } }
  );

  const url = URL.createObjectURL(new Blob([data], { type: "audio/mpeg" }));
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url));
  audio.play();
}
