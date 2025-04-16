
import { ChatMessage, PromptTemplate } from './types';
import { promptService } from './promptTemplates';
import { chatClient } from './chatClient';

export { type ChatMessage, type PromptTemplate };

// Combine all chat-related services
export const chatService = {
  ...chatClient,
  ...promptService
};

