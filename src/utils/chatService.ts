
import { PromptTemplate, ChatMessage } from './types';
import { promptService } from './promptTemplates';
import { chatClient } from './chatClient';

// Export these types so they can be imported from chatService
export type { PromptTemplate, ChatMessage };

export const chatService = {
  getPromptTemplates(): PromptTemplate[] {
    return promptService.getPromptTemplates();
  },

  setActivePromptTemplate(templateId: string): void {
    promptService.setActivePromptTemplate(templateId);
  },

  getActivePromptTemplateId(): string {
    return promptService.getActivePromptTemplateId();
  },

  updatePromptTemplate(template: PromptTemplate): void {
    promptService.updatePromptTemplate(template);
  },

  addPromptTemplate(template: Omit<PromptTemplate, 'id'>): PromptTemplate {
    return promptService.addPromptTemplate(template);
  },

  deletePromptTemplate(templateId: string): void {
    promptService.deletePromptTemplate(templateId);
  },

  async sendMessageToGemini(message: string, history: ChatMessage[]): Promise<string> {
    // Use the actual chatClient implementation instead of the placeholder
    return chatClient.sendMessageToGemini(message, history);
  }
};
