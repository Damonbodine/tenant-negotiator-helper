import { ChatMessage } from '@/shared/types';
import { featureFlags } from './featureFlags';

// Import both old and new services
import * as oldMemoryService from './memoryService';
import * as enhancedMemoryService from './enhancedMemoryService';
import { chatClient as oldChatClient } from './chatClient';
import { chatClient as enhancedChatClient } from './enhancedChatClient';

/**
 * Safe Migration Service
 * 
 * Handles safe transition between old and new memory systems
 * - Automatic fallback on errors
 * - Performance monitoring
 * - Gradual rollout control
 * - Error reporting
 */

interface MigrationMetrics {
  enhanced_calls: number;
  fallback_calls: number;
  errors: number;
  performance_gains: number[];
  last_reset: Date;
}

class SafeMigrationService {
  private metrics: MigrationMetrics = {
    enhanced_calls: 0,
    fallback_calls: 0,
    errors: 0,
    performance_gains: [],
    last_reset: new Date()
  };

  /**
   * SAFE MEMORY SERVICE - automatically chooses best implementation
   */
  async saveChatMemory(
    userId: string,
    messages: ChatMessage[],
    featureType: string = 'market'
  ): Promise<boolean> {
    const useEnhanced = featureFlags.isEnhancedMemoryEnabled(userId);
    const startTime = Date.now();

    try {
      if (useEnhanced) {
        console.log('🚀 Using enhanced memory service');
        const result = await enhancedMemoryService.saveChatMemory(userId, messages, featureType);
        
        this.metrics.enhanced_calls++;
        this.trackPerformance(startTime);
        
        return result;
      } else {
        console.log('📦 Using legacy memory service');
        const result = await oldMemoryService.saveChatMemory(userId, messages, featureType);
        
        this.metrics.fallback_calls++;
        
        return result;
      }
    } catch (error) {
      console.error('❌ Enhanced memory failed, falling back to legacy:', error);
      this.metrics.errors++;
      
      // Always fallback to old system on error
      try {
        const result = await oldMemoryService.saveChatMemory(userId, messages, featureType);
        this.metrics.fallback_calls++;
        return result;
      } catch (fallbackError) {
        console.error('❌ Both memory systems failed:', fallbackError);
        return false;
      }
    }
  }

  async getRecentMemories(
    userId: string,
    featureType: string = 'market',
    limit: number = 3
  ): Promise<string[]> {
    const useEnhanced = featureFlags.isEnhancedMemoryEnabled(userId);
    const startTime = Date.now();

    try {
      if (useEnhanced) {
        console.log('🚀 Using enhanced memory retrieval');
        const result = await enhancedMemoryService.getRecentMemories(userId, featureType, limit);
        
        this.metrics.enhanced_calls++;
        this.trackPerformance(startTime);
        
        return result;
      } else {
        console.log('📦 Using legacy memory retrieval');
        const result = await oldMemoryService.getRecentMemories(userId, featureType, limit);
        
        this.metrics.fallback_calls++;
        
        return result;
      }
    } catch (error) {
      console.error('❌ Enhanced memory retrieval failed, falling back:', error);
      this.metrics.errors++;
      
      try {
        const result = await oldMemoryService.getRecentMemories(userId, featureType, limit);
        this.metrics.fallback_calls++;
        return result;
      } catch (fallbackError) {
        console.error('❌ Both memory retrieval systems failed:', fallbackError);
        return [];
      }
    }
  }

  async deleteUserMemories(userId: string): Promise<boolean> {
    const useEnhanced = featureFlags.isEnhancedMemoryEnabled(userId);

    try {
      if (useEnhanced) {
        console.log('🚀 Using enhanced memory deletion');
        const result = await enhancedMemoryService.deleteUserMemories(userId);
        this.metrics.enhanced_calls++;
        return result;
      } else {
        console.log('📦 Using legacy memory deletion');
        const result = await oldMemoryService.deleteUserMemories(userId);
        this.metrics.fallback_calls++;
        return result;
      }
    } catch (error) {
      console.error('❌ Enhanced memory deletion failed, falling back:', error);
      this.metrics.errors++;
      
      try {
        const result = await oldMemoryService.deleteUserMemories(userId);
        this.metrics.fallback_calls++;
        return result;
      } catch (fallbackError) {
        console.error('❌ Both memory deletion systems failed:', fallbackError);
        return false;
      }
    }
  }

  formatMemoriesForContext(memories: string[]): string {
    // This function is pure and doesn't need enhancement, use either implementation
    return oldMemoryService.formatMemoriesForContext(memories);
  }

  /**
   * SAFE CHAT CLIENT - automatically chooses best implementation
   */
  async sendMessageToGemini(message: string, history: ChatMessage[], userId?: string): Promise<string> {
    const useEnhanced = featureFlags.isEnhancedChatClientEnabled(userId);
    const startTime = Date.now();

    try {
      if (useEnhanced) {
        console.log('🚀 Using enhanced chat client');
        const result = await enhancedChatClient.sendMessageToGemini(message, history);
        
        this.metrics.enhanced_calls++;
        this.trackPerformance(startTime);
        
        return result;
      } else {
        console.log('📦 Using legacy chat client');
        const result = await oldChatClient.sendMessageToGemini(message, history);
        
        this.metrics.fallback_calls++;
        
        return result;
      }
    } catch (error) {
      console.error('❌ Enhanced chat client failed, falling back:', error);
      this.metrics.errors++;
      
      try {
        const result = await oldChatClient.sendMessageToGemini(message, history);
        this.metrics.fallback_calls++;
        return result;
      } catch (fallbackError) {
        console.error('❌ Both chat clients failed:', fallbackError);
        throw fallbackError; // Re-throw since this is user-facing
      }
    }
  }

  setActivePromptTemplate(templateId: string): void {
    // Set on both clients to keep them in sync
    oldChatClient.setActivePromptTemplate(templateId);
    enhancedChatClient.setActivePromptTemplate(templateId);
  }

  getActivePromptTemplateId(): string {
    return oldChatClient.getActivePromptTemplateId();
  }

  /**
   * MONITORING AND DIAGNOSTICS
   */
  
  getMetrics(): MigrationMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      enhanced_calls: 0,
      fallback_calls: 0,
      errors: 0,
      performance_gains: [],
      last_reset: new Date()
    };
    console.log('📊 Migration metrics reset');
  }

  getSuccessRate(): number {
    const total = this.metrics.enhanced_calls + this.metrics.fallback_calls;
    if (total === 0) return 1;
    return (total - this.metrics.errors) / total;
  }

  getEnhancementAdoption(): number {
    const total = this.metrics.enhanced_calls + this.metrics.fallback_calls;
    if (total === 0) return 0;
    return this.metrics.enhanced_calls / total;
  }

  getAveragePerformanceGain(): number {
    if (this.metrics.performance_gains.length === 0) return 0;
    const sum = this.metrics.performance_gains.reduce((a, b) => a + b, 0);
    return sum / this.metrics.performance_gains.length;
  }

  /**
   * ADMINISTRATIVE FUNCTIONS
   */

  async performHealthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details: any }> {
    const metrics = this.getMetrics();
    const successRate = this.getSuccessRate();
    const errorRate = metrics.errors / (metrics.enhanced_calls + metrics.fallback_calls + metrics.errors);

    if (successRate > 0.95 && errorRate < 0.05) {
      return {
        status: 'healthy',
        details: { successRate, errorRate, metrics }
      };
    } else if (successRate > 0.8) {
      return {
        status: 'degraded',
        details: { successRate, errorRate, metrics, warning: 'Higher than normal error rate' }
      };
    } else {
      return {
        status: 'unhealthy',
        details: { successRate, errorRate, metrics, alert: 'System experiencing significant issues' }
      };
    }
  }

  enableEnhancedFeaturesForUser(userId: string): void {
    featureFlags.enableForUser(userId, {
      enhanced_memory_enabled: true,
      enhanced_chat_client_enabled: true,
      rental_memory_architecture_enabled: true
    });
    console.log(`✅ Enhanced features enabled for user ${userId}`);
  }

  disableEnhancedFeaturesForUser(userId: string): void {
    featureFlags.disableForUser(userId);
    console.log(`❌ Enhanced features disabled for user ${userId}`);
  }

  private trackPerformance(startTime: number): void {
    const duration = Date.now() - startTime;
    this.metrics.performance_gains.push(duration);
    
    // Keep only last 100 measurements
    if (this.metrics.performance_gains.length > 100) {
      this.metrics.performance_gains = this.metrics.performance_gains.slice(-100);
    }
  }
}

// Create singleton instance
const safeMigrationService = new SafeMigrationService();

// Export the same interfaces for drop-in replacement
export async function saveChatMemory(
  userId: string,
  messages: ChatMessage[],
  featureType: string = 'market'
): Promise<boolean> {
  return safeMigrationService.saveChatMemory(userId, messages, featureType);
}

export async function getRecentMemories(
  userId: string,
  featureType: string = 'market',
  limit: number = 3
): Promise<string[]> {
  return safeMigrationService.getRecentMemories(userId, featureType, limit);
}

export async function deleteUserMemories(userId: string): Promise<boolean> {
  return safeMigrationService.deleteUserMemories(userId);
}

export function formatMemoriesForContext(memories: string[]): string {
  return safeMigrationService.formatMemoriesForContext(memories);
}

// Chat client interface
export const chatClient = {
  setActivePromptTemplate(templateId: string): void {
    safeMigrationService.setActivePromptTemplate(templateId);
  },

  getActivePromptTemplateId(): string {
    return safeMigrationService.getActivePromptTemplateId();
  },

  async sendMessageToGemini(message: string, history: ChatMessage[], userId?: string): Promise<string> {
    return safeMigrationService.sendMessageToGemini(message, history, userId);
  }
};

// Export service for monitoring and administration
export { safeMigrationService }; 