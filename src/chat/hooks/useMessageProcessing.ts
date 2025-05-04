import { ChatMessage } from "@/shared/types";
import { agentService } from "@/shared/services/agentService";
import { voiceClient } from "@/shared/services/voiceClient";
import { analyzeListingUrl } from "@/listingAnalyzer/services/listingAnalyzerService";
import { ChatType } from "@/chat/hooks/useAgentChat";
import { chatPersistenceService } from "@/shared/services/chatPersistenceService";
import { v4 as uuidv4 } from 'uuid';

// --- Suggestions and triggers mapping ---
const suggestionList = [
  // 🏡 Rent Evaluation
  {
    text: "Do you want me to check if your apartment is overpriced?",
    trigger: (input: string) => /(zillow\.com|streeteasy\.com)/i.test(input)
  },
  {
    text: "How much do similar places in your neighborhood cost?",
    trigger: (input: string) =>
      /(rent\s?is|pay\s?\$?\d+|monthly[\s\S]{0,25}bushwick|in\s+[a-z\s]+)?\$\d+/.test(input)
  },
  {
    text: "Want to compare your rent to the city average?",
    trigger: (input: string, _history: ChatMessage[], isFirst: boolean) => isFirst
  },
  // 🤝 Negotiation Help
  {
    text: "Need help crafting a message to ask your landlord for a rent reduction?",
    trigger: (input: string) => /how (do|should) i (ask|request)[^.!?]*lower rent|rent reduction|negotiate/i.test(input)
  },
  {
    text: "Would it help if I explained your leverage in this market?",
    trigger: (input: string, history: ChatMessage[]) => {
      // After market analysis or hesitancy (look for key phrases in past agent messages)
      const lastAgentMsg = [...history].reverse().find(m => m.type === "agent")?.text || "";
      return /(market (analysis|average|insights)|not sure|hesitant|worth|good deal|overpriced)/i.test(lastAgentMsg);
    }
  },
  {
    text: "Should I coach you on what to say during a rent negotiation call?",
    trigger: (input: string) => /(call|phone|meeting|talk(ing)? to (the )?landlord)/i.test(input)
  },
  // 📆 Lease Renewal or Move
  {
    text: "When does your lease end? I can help you plan ahead.",
    trigger: (input: string) => /(renewal|moving|lease ends?( in [a-z]+)?)/i.test(input)
  },
  {
    text: "Should we talk through your options before you sign that renewal?",
    trigger: (input: string) => /(got|received|offered) (a )?new lease/i.test(input)
  },
  {
    text: "Want to see if you qualify for relocation cash or grants?",
    trigger: () => true // Always available (useful as a general suggestion)
  },
  // 🔎 Fairness, Fees, & Law
  {
    text: "Did you know some broker fees in NYC are illegal? Want help checking yours?",
    trigger: (input: string) => /(fee|broker|application)/i.test(input)
  },
  {
    text: "Want to check if your landlord is violating any fair housing laws?",
    trigger: (input: string) => /(discriminat|unfair|illegal|sketchy|bias|landlord)/i.test(input)
  },
  {
    text: "Should I show you what to expect on move-in day so you're not caught off guard?",
    trigger: (input: string) => /(move|moved|moving|new apartment)/i.test(input)
  },
  // 🧠 Education & Tips
  {
    text: "Want a quick negotiation tip that works almost every time?",
    trigger: (input: string, _history: ChatMessage[], isFirst: boolean) => isFirst
  },
  {
    text: "Should I explain what most landlords don't want you to know?",
    trigger: () => true // Always an option
  }
];

function getDynamicSuggestions(
  input: string,
  history: ChatMessage[],
  isFirst: boolean
): string[] {
  // Limit to 3 at a time (adjust if desired), prefer one from each section
  const suggestions: string[] = [];
  for (let s of suggestionList) {
    try {
      if (s.trigger(input, history, isFirst)) suggestions.push(s.text);
      if (suggestions.length >= 4) break;
    } catch {}
  }
  // Always dedupe
  return Array.from(new Set(suggestions));
}

interface UseMessageProcessingProps {
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setInput: (input: string) => void;
  setIsLoading: (loading: boolean) => void;
  setShowApiKeyInput: (show: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  handleError: (error: any) => void;
  selectedVoice: string;
  chatType?: ChatType;
  setIsTyping?: (isTyping: boolean) => void;
}

export async function processUserMessage(messageText: string, {
  setMessages,
  setInput,
  setIsLoading,
  setShowApiKeyInput,
  setSuggestions,
  audioRef,
  handleError,
  selectedVoice,
  chatType = "general",
  setIsTyping
}: UseMessageProcessingProps) {
  if (!messageText.trim() || setIsLoading) return;
  
  const userMessage: ChatMessage = {
    id: uuidv4(),
    type: "user",
    text: messageText,
    timestamp: new Date(),
    isRead: true // User's own messages are always read
  };
  
  setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);
  setSuggestions([]);
  
  // Save user message to persistence layer
  try {
    await chatPersistenceService.saveMessage(userMessage);
  } catch (error) {
    console.error("Error saving user message:", error);
    // Continue even if saving fails
  }

  const getIsFirstInteraction = (history: ChatMessage[]) => {
    // Only count user and agent messages for determining if this is the first interaction
    const realHistory = history.filter(m => m.type === "user" || m.type === "agent");
    return realHistory.length <= 1;
  };
  
  try {
    // Create a function that matches the expected signature for adding agent messages
    const addAgentMessage = (msg: ChatMessage) => {
      // Ensure the message has an ID and timestamp if not provided
      const enhancedMsg = {
        ...msg,
        id: msg.id || uuidv4(),
        timestamp: msg.timestamp || new Date(),
        isRead: false // New agent messages are unread initially
      };
      
      setMessages(prev => [...prev, enhancedMsg]);
      
      // Save agent message to persistence layer
      chatPersistenceService.saveMessage(enhancedMsg).catch(err => {
        console.error("Error saving agent message:", err);
      });
      
      return enhancedMsg;
    };

    // Check if it's a URL for analysis
    const wasListingAnalyzed = await analyzeListingUrl(messageText, addAgentMessage);
    if (wasListingAnalyzed) {
      // Show suggestions after a listing analysis, use default market suggestions
      setSuggestions([
        "Need help crafting a message to ask your landlord for a rent reduction?",
        "Want to compare your rent to the city average?",
        "Want a quick negotiation tip that works almost every time?"
      ]);
      setIsLoading(false);
      if (setIsTyping) setIsTyping(false);
      return;
    }

    if (!(await voiceClient.hasApiKey())) {
      setShowApiKeyInput(true);
      setIsLoading(false);
      if (setIsTyping) setIsTyping(false);
      return;
    }

    let response;
    switch(chatType) {
      case "market":
        response = await agentService.getMarketInsights(messageText);
        break;
      case "negotiation":
        response = await agentService.getNegotiationAdvice(messageText);
        break;
      default:
        response = await agentService.simulateResponse(messageText);
    }

    // Add a practice negotiation CTA to the response
    if (response.text && !response.text.includes("Want to practice negotiating")) {
      response.text += "\n\n**[Want to practice negotiating this scenario? [Click here to try our negotiation simulator](/practice/voice)]**";
    }

    const finalAgentMessage: ChatMessage = {
      id: uuidv4(),
      type: "agent",
      text: response.text,
      timestamp: new Date(),
      isRead: false // New agent messages are unread initially
    };

    // Add the agent message to the UI
    setMessages((prev: ChatMessage[]) => [...prev, finalAgentMessage]);
    
    // Save agent message to persistence layer
    try {
      await chatPersistenceService.saveMessage(finalAgentMessage);
    } catch (error) {
      console.error("Error saving agent response:", error);
    }

    // SUGGESTIONS: Analyze input + history and add suggestions for next steps
    // Create a history array with the current interaction
    const currentHistory = [userMessage, finalAgentMessage];
    
    // Calculate dynamic suggestions
    const dynamicSuggestions = getDynamicSuggestions(
      messageText,
      currentHistory,
      getIsFirstInteraction(currentHistory)
    );
    
    // Set the dynamic suggestions
    setSuggestions(dynamicSuggestions);

    // Agent voice response
    try {
      agentService.setVoice(selectedVoice);
      const audioBuffer = await agentService.generateSpeech(response.text);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      throw new Error("Could not generate speech. Check your API key and try again.");
    }
  } catch (error: any) {
    handleError(error);
  } finally {
    setIsLoading(false);
    if (setIsTyping) setIsTyping(false);
  }
}
