import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/shared/types';

export interface ConversationSummaryRequest {
  conversationId: string;
  messages: ChatMessage[];
  conversationType: string;
}

class ConversationSummaryService {
  /**
   * Generate an AI summary for a conversation
   */
  async generateSummary(request: ConversationSummaryRequest): Promise<string> {
    try {
      // Only generate summary if there are at least 2 meaningful messages
      const meaningfulMessages = request.messages.filter(m => 
        m.text.length > 10 && !m.text.includes('Welcome! I\'m your negotiation coach')
      );

      if (meaningfulMessages.length < 2) {
        return this.getDefaultSummary(request.conversationType);
      }

      // Prepare conversation text for summarization
      const conversationText = meaningfulMessages
        .slice(0, 10) // Only use first 10 messages to avoid token limits
        .map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');

      // Call OpenAI for summarization
      const response = await fetch('/api/summarize-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversationText,
          type: request.conversationType
        })
      });

      if (!response.ok) {
        console.warn('Failed to get AI summary, using fallback');
        return this.generateLocalSummary(meaningfulMessages, request.conversationType);
      }

      const { summary } = await response.json();
      return summary || this.generateLocalSummary(meaningfulMessages, request.conversationType);

    } catch (error) {
      console.error('Error generating AI summary:', error);
      return this.generateLocalSummary(request.messages, request.conversationType);
    }
  }

  /**
   * Generate a simple local summary without AI
   */
  private generateLocalSummary(messages: ChatMessage[], type: string): string {
    const userMessages = messages.filter(m => m.type === 'user');
    
    if (userMessages.length === 0) {
      return this.getDefaultSummary(type);
    }

    // Extract key topics from user messages
    const firstUserMessage = userMessages[0].text;
    const topics = this.extractTopics(firstUserMessage);
    
    if (topics.length > 0) {
      return `Discussion about ${topics.join(', ')}`;
    }

    // Fallback to first few words of first user message
    const preview = firstUserMessage.substring(0, 50);
    return preview.length < firstUserMessage.length ? `${preview}...` : preview;
  }

  /**
   * Extract key rental-related topics from text
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    // Rent-related patterns
    if (lowerText.includes('rent') && lowerText.includes('$')) {
      const rentMatch = text.match(/\$[\d,]+/);
      if (rentMatch) {
        topics.push(`${rentMatch[0]} rent`);
      }
    } else if (lowerText.includes('rent')) {
      topics.push('rent negotiation');
    }

    // Property-related patterns
    if (lowerText.includes('apartment') || lowerText.includes('unit')) {
      topics.push('apartment');
    }
    if (lowerText.includes('lease')) {
      topics.push('lease terms');
    }
    if (lowerText.includes('deposit')) {
      topics.push('security deposit');
    }
    if (lowerText.includes('roommate')) {
      topics.push('roommate');
    }
    if (lowerText.includes('increase')) {
      topics.push('rent increase');
    }

    return topics;
  }

  /**
   * Get default summary based on conversation type
   */
  private getDefaultSummary(type: string): string {
    const defaults: Record<string, string> = {
      'negotiation_help': 'Rent negotiation assistance',
      'listing_analyzer': 'Property listing analysis',
      'comparables': 'Property comparison',
      'voice_chat': 'Voice practice session',
      'email_script_builder': 'Email script generation',
      'price_analysis': 'Price analysis',
      'general_advice': 'General rental advice'
    };
    
    return defaults[type] || 'Rental discussion';
  }

  /**
   * Update conversation with generated summary
   */
  async updateConversationSummary(conversationId: string, summary: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rental_conversations')
        .update({ context_summary: summary })
        .eq('id', conversationId);

      if (error) {
        console.error('Failed to save conversation summary:', error);
      }
    } catch (error) {
      console.error('Error updating conversation summary:', error);
    }
  }

  /**
   * Generate and save summary for a conversation
   */
  async generateAndSaveSummary(request: ConversationSummaryRequest): Promise<string> {
    const summary = await this.generateSummary(request);
    await this.updateConversationSummary(request.conversationId, summary);
    return summary;
  }
}

export const conversationSummaryService = new ConversationSummaryService();