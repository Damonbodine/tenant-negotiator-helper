import { ChatMessage } from "@/shared/types";
import { randomTip } from "@/shared/utils/negotiationTips";
import { toast } from "@/shared/hooks/use-toast";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";
import { supabase } from "@/integrations/supabase/client";
import { getRecentMemories } from "@/shared/services/memoryService";
import { parallelIntelligence } from "@/shared/services/parallelIntelligenceService";
import { intelligentContext } from "@/shared/services/intelligentContextService";

interface ListingAnalysisResponse {
  error?: string;
  message?: string;
  address?: string;
  rent?: number;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  zipcode?: string;
  marketAverage?: number;
  deltaPercent?: string;
  verdict?: string;
  sourceUrl?: string;
  propertyName?: string;
  analysisMethod?: string;
}

interface AddressAnalysisResponse {
  address: string;
  text: string;
  sources?: string[];
  error?: string;
  message?: string;
}

// Helper to get memories for AI context
async function getMemoryContextForAI(): Promise<string[]> {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log("No authenticated user for memory context");
      return [];
    }
    
    // Get recent memories - with timeout and error handling
    console.log("Attempting to get memories for user:", session.user.id);
    const memories = await Promise.race([
      getRecentMemories(session.user.id, 'market'),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 2000)) // 2 second timeout
    ]);
    
    console.log("Retrieved memories count:", memories.length);
    return memories;
  } catch (error) {
    console.warn("Memory retrieval failed (non-blocking):", error);
    // Always return empty array on error - don't break the listing analyzer
    return [];
  }
}

// NEW: Analyze manually entered property details
export async function analyzeManualProperty(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `🧠 I'm extracting property details from your input and analyzing them...`,
    timestamp: new Date()
  });

  try {
    console.log("Analyzing manual property input:", text);
    
    // Get memory context for AI
    const memories = await getMemoryContextForAI();
    console.log("Got memory context, memories count:", memories.length);
    
    const data = await analyzeAddressWithSupabase({ 
      address: text,
      memories
    });
    
    console.log("Received manual property analysis:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }

    let analysisText = `🏠 **Property Analysis**\n\n`;
    
    analysisText += data.text;
    
    analysisText += `\n\n---\n💡 **Negotiation tip:** ${randomTip()}`;

    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: analysisText,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error analyzing manual property:", error);
    
    toast({
      title: "Error analyzing property",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: error instanceof Error 
        ? `⚠️ ${error.message}`
        : "⚠️ I encountered an error while analyzing those details. Please try including more information like address, rent amount, beds/baths, and square footage.",
      timestamp: new Date()
    });
    
    return true;
  }
}

export async function analyzeListingUrl(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor|hotpads|facebook)\.com\/[^\s]+)/i;
  const match = text.match(urlRegex);
  
  if (!match) {
    // Check if this looks like property details instead of an address
    const hasPropertyDetails = text.match(/(bed|bath|rent|\$\d+|sqft|square)/i);
    
    if (hasPropertyDetails) {
      // This looks like manual property details
      return await analyzeManualProperty(text, addAgentMessage);
    } else if (text.includes(",") || /\d+\s+\w+/.test(text)) {
      // This looks like an address
      return await analyzeAddress(text, addAgentMessage);
    }
    return false;
  }
  
  const url = match[0].trim().replace(/[.,;!?)\]]+$/, "");
  console.log("Detected listing URL (cleaned):", url);
  
  // Simple, clean user feedback
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this listing for you. This may take 15-20 seconds...`,
    timestamp: new Date()
  });

  try {
    console.log("🔍 Starting listing analysis for URL:", url);
    console.log("🔐 Current auth state - checking session...");
    
    // Check auth state before API call
    const { data: { session } } = await supabase.auth.getSession();
    console.log("🔐 Session exists:", !!session);
    console.log("🔐 User ID:", session?.user?.id || 'none');
    
    console.log("📡 Calling analyzeListingWithSupabase...");
    const data = await analyzeListingWithSupabase(url);
    
    console.log("✅ Received listing analysis data:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }

    if (data.message && (!data.address || !data.rent)) {
      throw new Error(data.message);
    }

    let analysisText = "";
    if (data.address) {
      const addressLine = data.propertyName && !data.address.includes(data.propertyName) 
        ? `**${data.propertyName}** (${data.address})`
        : `**${data.address}**`;
        
      analysisText = `🔎 ${addressLine}\n\n`;
      
      if (data.rent) {
        analysisText += `💰 **Listed rent:** $${data.rent}`;
      }
      
      if (data.beds) {
        analysisText += ` 🛏️ **Beds:** ${data.beds}`;
      }
      
      if (data.baths) {
        analysisText += ` 🚿 **Baths:** ${data.baths}`;
      }
      
      if (data.sqft) {
        analysisText += ` 📏 **Square feet:** ${data.sqft}`;
      }
      
      if (data.marketAverage) {
        analysisText += `\n\n📈 **Market comparison:**\n`;
        analysisText += `• **Average:** $${data.marketAverage}/month\n`;
        analysisText += `• **Difference:** ${data.deltaPercent}% (${data.verdict})`;
      }
      
      // Send the main analysis message first
      addAgentMessage({
        id: crypto.randomUUID(),
        type: "agent",
        text: analysisText,
        timestamp: new Date()
      });
      
      // Send disclaimer immediately after showing extracted data
      addAgentMessage({
        id: crypto.randomUUID(),
        type: "agent",
        text: `💡 **Check the details above** - if anything looks wrong, please manually enter: address, city, state, zip, rent, beds, baths, and square footage.`,
        timestamp: new Date()
      });
      
      try {
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent",
          text: "Now retrieving detailed market analysis for this area...",
          timestamp: new Date()
        });
        
        console.log("Fetching detailed analysis for address:", data.address);
        
        // Get memory context for AI
        const memories = await getMemoryContextForAI();
        console.log("Got memory context, memories count:", memories.length);
        
        const detailedAnalysis = await analyzeAddressWithSupabase({
          address: data.address,
          memories
        });
        
        if (detailedAnalysis && detailedAnalysis.text && detailedAnalysis.text.length > 10) {
          addAgentMessage({
            id: crypto.randomUUID(),
            type: "agent",
            text: detailedAnalysis.text,
            timestamp: new Date()
          });
        }
      } catch (detailedError) {
        console.error("Error in detailed analysis:", detailedError);
        addAgentMessage({
          id: crypto.randomUUID(),
          type: "agent", 
          text: "⚠️ I extracted the basic listing details, but couldn't retrieve the detailed market analysis. The property information above is still valid.",
          timestamp: new Date()
        });
      }
      
      return true;
    } else {
      throw new Error("Could not extract address information from this listing.");
    }
  } catch (error) {
    console.error("Error analyzing listing URL:", error);
    
    // Simple error handling
    let errorMessage = "I couldn't extract the details from that listing automatically.";
    
    if (error.message.includes('Facebook')) {
      errorMessage = "Facebook Marketplace requires login to view listings.";
    }
    
    errorMessage += "\n\n💡 **Try manually entering the details:** Please type the address, city, state, zip, rent, beds, baths, and square footage from the listing.";
    
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: errorMessage,
      timestamp: new Date()
    });
    
    toast({
      title: "Analysis Failed",
      description: error.message,
      variant: "destructive",
    });

    return true;
  }
}

// Remove the overly technical functions that were adding noise to user messages
// Keep them in backend for logging but don't expose to users

export async function analyzeAddress(
  text: string,
  addAgentMessage: (m: ChatMessage) => void
) {
  addAgentMessage({
    id: crypto.randomUUID(),
    type: "agent",
    text: `I'm analyzing this address for you. This may take 15-20 seconds... If we retrieve the wrong
    property try entering the address manually.`,
    timestamp: new Date()
  });

  try {
    console.log("Sending request to address-analyzer API with text:", text);
    
    // Get memory context for AI
    const memories = await getMemoryContextForAI();
    console.log("Got memory context, memories count:", memories.length);
    
    const data = await analyzeAddressWithSupabase({ 
      address: text,
      memories
    });
    
    console.log("Received address analysis data:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }

    let analysisText = `🔎 **Analysis for ${data.address}**\n\n`;
    
    analysisText += data.text;
    
    analysisText += `\n\n---\n💡 **Negotiation tip:** ${randomTip()}`;

    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: analysisText,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error("Error analyzing address:", error);
    
    toast({
      title: "Error analyzing address",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    
    addAgentMessage({
      id: crypto.randomUUID(),
      type: "agent",
      text: error instanceof Error 
        ? `⚠️ ${error.message}`
        : "⚠️ I encountered an error while analyzing that address. Please try with a more specific address including city and state.",
      timestamp: new Date()
    });
    
    return true;
  }
}