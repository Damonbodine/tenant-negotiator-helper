
// Create this file to ensure imports are working correctly

import { PromptTemplate, ChatMessage } from './types';
import { promptService } from './promptTemplates';

export const chatService = {
  getPromptTemplates(): PromptTemplate[] {
    return promptService.getPromptTemplates();
  },

  setActivePromptTemplate(templateId: string): void {
    promptService.setActivePromptTemplate?.(templateId) ?? null;
  },

  getActivePromptTemplateId(): string {
    return promptService.getActivePromptTemplateId?.() ?? 'rental-agent';
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
    return promptService.sendMessageToGemini?.(message, history) ?? "Error: Message sending not implemented";
  }
};
