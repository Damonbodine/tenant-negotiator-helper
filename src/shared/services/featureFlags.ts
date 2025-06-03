/**
 * Feature Flag System
 * 
 * Controls rollout of enhanced memory system with safe fallbacks
 * Allows gradual migration without breaking existing functionality
 */

interface FeatureFlags {
  enhanced_memory_enabled: boolean;
  enhanced_chat_client_enabled: boolean;
  rental_memory_architecture_enabled: boolean;
  memory_fallback_enabled: boolean;
  debug_enhanced_features: boolean;
}

// Default feature flags - start with everything disabled for safety
const DEFAULT_FLAGS: FeatureFlags = {
  enhanced_memory_enabled: false,
  enhanced_chat_client_enabled: false, 
  rental_memory_architecture_enabled: false,
  memory_fallback_enabled: true, // Always enable fallback for safety
  debug_enhanced_features: false
};

// Environment-based overrides (can be controlled via env vars)
const ENV_FLAGS: Partial<FeatureFlags> = {
  enhanced_memory_enabled: import.meta.env.VITE_ENHANCED_MEMORY === 'true',
  enhanced_chat_client_enabled: import.meta.env.VITE_ENHANCED_CHAT_CLIENT === 'true',
  rental_memory_architecture_enabled: import.meta.env.VITE_RENTAL_MEMORY_ARCH === 'true',
  debug_enhanced_features: import.meta.env.DEV || false
};

// User-based feature flags (for gradual rollout)
const USER_ROLLOUT_PERCENTAGE = parseInt(import.meta.env.VITE_ENHANCED_ROLLOUT_PERCENTAGE || '0');

class FeatureFlagService {
  private flags: FeatureFlags;
  private userFlags: Map<string, Partial<FeatureFlags>> = new Map();

  constructor() {
    this.flags = { ...DEFAULT_FLAGS, ...ENV_FLAGS };
    console.log('🏁 Feature flags initialized:', this.flags);
  }

  /**
   * Check if enhanced memory should be used for a user
   */
  isEnhancedMemoryEnabled(userId?: string): boolean {
    // Check user-specific flags first
    if (userId && this.userFlags.has(userId)) {
      const userFlag = this.userFlags.get(userId)?.enhanced_memory_enabled;
      if (userFlag !== undefined) return userFlag;
    }

    // Check global flag
    if (this.flags.enhanced_memory_enabled) return true;

    // Check rollout percentage
    if (userId && USER_ROLLOUT_PERCENTAGE > 0) {
      return this.isUserInRollout(userId, USER_ROLLOUT_PERCENTAGE);
    }

    return false;
  }

  /**
   * Check if enhanced chat client should be used
   */
  isEnhancedChatClientEnabled(userId?: string): boolean {
    if (userId && this.userFlags.has(userId)) {
      const userFlag = this.userFlags.get(userId)?.enhanced_chat_client_enabled;
      if (userFlag !== undefined) return userFlag;
    }

    return this.flags.enhanced_chat_client_enabled;
  }

  /**
   * Check if rental memory architecture should be used
   */
  isRentalMemoryArchitectureEnabled(userId?: string): boolean {
    if (userId && this.userFlags.has(userId)) {
      const userFlag = this.userFlags.get(userId)?.rental_memory_architecture_enabled;
      if (userFlag !== undefined) return userFlag;
    }

    return this.flags.rental_memory_architecture_enabled;
  }

  /**
   * Check if fallback to old system is enabled (should always be true)
   */
  isFallbackEnabled(): boolean {
    return this.flags.memory_fallback_enabled;
  }

  /**
   * Check if debug mode is enabled for enhanced features
   */
  isDebugEnabled(): boolean {
    return this.flags.debug_enhanced_features;
  }

  /**
   * Enable enhanced features for a specific user
   */
  enableForUser(userId: string, features: Partial<FeatureFlags>): void {
    this.userFlags.set(userId, features);
    console.log(`🏁 Enhanced features enabled for user ${userId}:`, features);
  }

  /**
   * Disable enhanced features for a specific user
   */
  disableForUser(userId: string): void {
    this.userFlags.delete(userId);
    console.log(`🏁 Enhanced features disabled for user ${userId}`);
  }

  /**
   * Get all flags for debugging
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update global flags (for runtime configuration)
   */
  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
    console.log('🏁 Feature flags updated:', this.flags);
  }

  /**
   * Determine if user is in rollout percentage
   */
  private isUserInRollout(userId: string, percentage: number): boolean {
    // Use user ID hash to determine rollout (consistent across sessions)
    const hash = this.simpleHash(userId);
    return (hash % 100) < percentage;
  }

  /**
   * Simple hash function for user ID
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Create singleton instance
export const featureFlags = new FeatureFlagService();

// Convenience functions for components
export function useEnhancedMemory(userId?: string): boolean {
  return featureFlags.isEnhancedMemoryEnabled(userId);
}

export function useEnhancedChatClient(userId?: string): boolean {
  return featureFlags.isEnhancedChatClientEnabled(userId);
}

export function useRentalMemoryArchitecture(userId?: string): boolean {
  return featureFlags.isRentalMemoryArchitectureEnabled(userId);
}

// Debug helper
export function debugFeatureFlags(): void {
  console.log('🏁 Current feature flags:', featureFlags.getAllFlags());
}

// Environment variable helper for .env configuration
export function getFeatureFlagEnvHelp(): string {
  return `
# Enhanced Memory System Feature Flags
REACT_APP_ENHANCED_MEMORY=false
REACT_APP_ENHANCED_CHAT_CLIENT=false  
REACT_APP_RENTAL_MEMORY_ARCH=false
REACT_APP_ENHANCED_ROLLOUT_PERCENTAGE=0

# To enable enhanced features:
# REACT_APP_ENHANCED_MEMORY=true
# REACT_APP_ENHANCED_CHAT_CLIENT=true
# REACT_APP_RENTAL_MEMORY_ARCH=true
# REACT_APP_ENHANCED_ROLLOUT_PERCENTAGE=10  # 10% rollout
`;
} 