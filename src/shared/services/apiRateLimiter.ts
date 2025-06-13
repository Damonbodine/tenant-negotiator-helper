/**
 * Global API Rate Limiter
 * Prevents excessive API calls that could lead to runaway costs
 */

interface RateLimitConfig {
  maxCallsPerMinute: number;
  minIntervalMs: number;
  emergencyThreshold: number; // Max calls before emergency shutdown
}

interface CallRecord {
  timestamp: number;
  endpoint: string;
  userId?: string;
}

class APIRateLimiter {
  private callHistory: CallRecord[] = [];
  private emergencyShutdown = false;
  private config: RateLimitConfig = {
    maxCallsPerMinute: 30, // Conservative limit
    minIntervalMs: 2000, // 2 seconds between calls
    emergencyThreshold: 100 // Emergency shutdown after 100 calls in short time
  };

  private lastCallTime = 0;

  /**
   * Check if an API call should be allowed
   */
  canMakeCall(endpoint: string, userId?: string): boolean {
    if (this.emergencyShutdown) {
      console.error('🚨 Emergency shutdown active - API calls blocked');
      return false;
    }

    const now = Date.now();
    
    // Check minimum interval between calls
    if (now - this.lastCallTime < this.config.minIntervalMs) {
      console.warn(`⏱️ Rate limited: ${this.config.minIntervalMs - (now - this.lastCallTime)}ms remaining`);
      return false;
    }

    // Clean old records (older than 1 minute)
    this.cleanOldRecords();

    // Check calls per minute
    const recentCalls = this.callHistory.filter(
      record => now - record.timestamp < 60000
    );

    if (recentCalls.length >= this.config.maxCallsPerMinute) {
      console.warn(`📊 Rate limited: ${recentCalls.length}/${this.config.maxCallsPerMinute} calls in last minute`);
      return false;
    }

    // Emergency threshold check
    if (this.callHistory.length >= this.config.emergencyThreshold) {
      this.triggerEmergencyShutdown();
      return false;
    }

    return true;
  }

  /**
   * Record an API call
   */
  recordCall(endpoint: string, userId?: string): void {
    const now = Date.now();
    
    this.callHistory.push({
      timestamp: now,
      endpoint,
      userId
    });

    this.lastCallTime = now;
    
    console.log(`📞 API call recorded: ${endpoint} (${this.callHistory.length} total)`);
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): {
    totalCalls: number;
    callsLastMinute: number;
    isRateLimited: boolean;
    emergencyShutdown: boolean;
    nextAllowedCall?: number;
  } {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(
      record => now - record.timestamp < 60000
    );

    const timeSinceLastCall = now - this.lastCallTime;
    const nextAllowedCall = timeSinceLastCall < this.config.minIntervalMs 
      ? this.config.minIntervalMs - timeSinceLastCall 
      : 0;

    return {
      totalCalls: this.callHistory.length,
      callsLastMinute: recentCalls.length,
      isRateLimited: nextAllowedCall > 0 || recentCalls.length >= this.config.maxCallsPerMinute,
      emergencyShutdown: this.emergencyShutdown,
      nextAllowedCall: nextAllowedCall > 0 ? nextAllowedCall : undefined
    };
  }

  /**
   * Trigger emergency shutdown to prevent runaway costs
   */
  private triggerEmergencyShutdown(): void {
    this.emergencyShutdown = true;
    console.error('🚨 EMERGENCY SHUTDOWN: Too many API calls detected!');
    console.error('🚨 All further API calls blocked to prevent excessive charges');
    
    // Auto-reset after 5 minutes
    setTimeout(() => {
      this.reset();
      console.log('✅ Emergency shutdown reset - API calls re-enabled');
    }, 5 * 60 * 1000);
  }

  /**
   * Clean old call records
   */
  private cleanOldRecords(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.callHistory = this.callHistory.filter(
      record => record.timestamp > oneHourAgo
    );
  }

  /**
   * Reset the rate limiter (emergency use only)
   */
  reset(): void {
    this.callHistory = [];
    this.emergencyShutdown = false;
    this.lastCallTime = 0;
    console.log('🔄 API Rate Limiter reset');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Rate limiter config updated:', this.config);
  }
}

// Export singleton instance
export const apiRateLimiter = new APIRateLimiter();
export default apiRateLimiter;