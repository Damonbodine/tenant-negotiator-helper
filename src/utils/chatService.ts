
import { ChatMessage, PromptTemplate } from './types';
import { promptService } from './promptTemplates';
import { chatClient } from './chatClient';

export { type ChatMessage, type PromptTemplate };

export const chatService = {
  ...chatClient,
  ...promptService
};
