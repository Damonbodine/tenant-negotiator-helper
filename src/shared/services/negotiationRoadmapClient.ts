import { supabase } from '@/integrations/supabase/client';
import { NegotiationRoadmapData } from '@/shared/types/artifacts';
import { useArtifactStore } from '@/shared/stores/artifactStore';

export interface NegotiationRoadmapRequest {
  userContext: {
    income?: number;
    currentRent: number;
    budgetFlexibility: 'tight' | 'moderate' | 'flexible';
    creditScore?: number;
    employmentStability: 'stable' | 'variable' | 'unstable';
    preferredTone: 'direct' | 'diplomatic' | 'collaborative' | 'assertive';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    conflictStyle: 'avoider' | 'compromiser' | 'competitor' | 'collaborator';
    landlordRelationship: 'new' | 'positive' | 'neutral' | 'strained';
    tenantHistory: 'first-time' | 'experienced' | 'veteran';
    urgency: 'flexible' | 'moderate' | 'urgent';
    alternativeOptions: number;
    movingFlexibility: 'committed-to-stay' | 'willing-to-move' | 'eager-to-move';
  };
  marketContext: {
    currentRentVsMarket: 'below' | 'at' | 'above' | 'significantly-above';
    marketPosition: number;
    propertyCondition: 'excellent' | 'good' | 'fair' | 'needs-work';
    landlordType: 'individual' | 'small-company' | 'corporate' | 'property-manager';
    localVacancyRate: number;
    rentTrend: 'increasing' | 'stable' | 'decreasing';
    seasonalFactor: 'peak' | 'normal' | 'slow';
    economicIndicators: 'strong' | 'stable' | 'uncertain' | 'declining';
    comparableRange: { min: number; max: number; median: number };
    negotiationLeverage: 'low' | 'moderate' | 'high';
    marketPowerBalance: 'landlord-favored' | 'balanced' | 'tenant-favored';
  };
  situationContext: {
    leaseStatus: 'pre-application' | 'application-pending' | 'active-lease' | 'renewal-period';
    timeUntilDecision: number;
    primaryGoal: 'rent-reduction' | 'amenity-addition' | 'lease-terms' | 'maintenance-issues';
    targetReduction: number;
    competingOffers: boolean;
    lifeEvents: 'job-change' | 'income-reduction' | 'family-change' | 'none';
    marketEvent: 'new-competition' | 'area-development' | 'economic-shift' | 'none';
  };
  location?: string; // Property/rental location for RAG market intelligence
}

class NegotiationRoadmapClientService {
  
  /**
   * Generate a negotiation roadmap and trigger the artifact
   */
  async generateAndTriggerRoadmap(request: NegotiationRoadmapRequest): Promise<NegotiationRoadmapData> {
    console.log('🚀 Generating enhanced negotiation roadmap with RAG intelligence:', {
      currentRent: request.userContext.currentRent,
      location: request.location || 'Not specified',
      strategy: 'Market data integration enabled'
    });
    
    try {
      // Call the enhanced edge function to generate the roadmap
      const { data, error } = await supabase.functions.invoke('negotiation-roadmap', {
        body: request
      });
      
      if (error) {
        console.error('❌ Error generating roadmap:', error);
        throw new Error(`Failed to generate roadmap: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No roadmap data returned from edge function');
      }
      
      console.log('✅ Enhanced roadmap generated successfully:', {
        strategy: data.strategy?.name,
        hasMarketIntelligence: !!data.marketIntelligence,
        comparableProperties: data.marketIntelligence?.comparableProperties?.length || 0,
        evidencePoints: data.marketIntelligence?.evidencePoints?.length || 0
      });
      
      // Trigger the artifact in the UI
      const artifactStore = useArtifactStore.getState();
      artifactStore.triggerNegotiationRoadmap(data);
      
      return data as NegotiationRoadmapData;
      
    } catch (error) {
      console.error('❌ Failed to generate negotiation roadmap:', error);
      throw error;
    }
  }
  
  /**
   * Generate a basic roadmap from conversational context
   */
  async generateBasicRoadmap(conversationContext: {
    currentRent?: number;
    targetRent?: number;
    location?: string;
    landlordType?: string;
    userTone?: string;
  }): Promise<NegotiationRoadmapData> {
    
    // Extract values with defaults
    const currentRent = conversationContext.currentRent || 2000;
    const targetRent = conversationContext.targetRent || currentRent * 0.9;
    const targetReduction = currentRent - targetRent;
    
    // Create basic request with intelligent defaults
    const request: NegotiationRoadmapRequest = {
      userContext: {
        currentRent,
        budgetFlexibility: 'moderate',
        employmentStability: 'stable',
        preferredTone: this.mapToneFromConversation(conversationContext.userTone),
        riskTolerance: 'moderate',
        conflictStyle: 'collaborator',
        landlordRelationship: 'neutral',
        tenantHistory: 'experienced',
        urgency: 'moderate',
        alternativeOptions: 2,
        movingFlexibility: 'willing-to-move'
      },
      marketContext: {
        currentRentVsMarket: this.inferMarketPosition(currentRent, targetRent),
        marketPosition: 60, // Middle percentile
        propertyCondition: 'good',
        landlordType: this.mapLandlordType(conversationContext.landlordType),
        localVacancyRate: 5.5,
        rentTrend: 'stable',
        seasonalFactor: 'normal',
        economicIndicators: 'stable',
        comparableRange: {
          min: targetRent * 0.9,
          max: currentRent * 1.1,
          median: (targetRent + currentRent) / 2
        },
        negotiationLeverage: 'moderate',
        marketPowerBalance: 'balanced'
      },
      situationContext: {
        leaseStatus: 'active-lease',
        timeUntilDecision: 30,
        primaryGoal: 'rent-reduction',
        targetReduction,
        competingOffers: false,
        lifeEvents: 'none',
        marketEvent: 'none'
      },
      location: conversationContext.location // Pass location for RAG integration
    };
    
    return this.generateAndTriggerRoadmap(request);
  }
  
  private mapToneFromConversation(tone?: string): 'direct' | 'diplomatic' | 'collaborative' | 'assertive' {
    if (!tone) return 'collaborative';
    
    const lowerTone = tone.toLowerCase();
    if (lowerTone.includes('direct') || lowerTone.includes('straight')) return 'direct';
    if (lowerTone.includes('diplomatic') || lowerTone.includes('polite')) return 'diplomatic';
    if (lowerTone.includes('assertive') || lowerTone.includes('firm')) return 'assertive';
    return 'collaborative';
  }
  
  private mapLandlordType(type?: string): 'individual' | 'small-company' | 'corporate' | 'property-manager' {
    if (!type) return 'individual';
    
    const lowerType = type.toLowerCase();
    if (lowerType.includes('corporate') || lowerType.includes('company') || lowerType.includes('corporation')) return 'corporate';
    if (lowerType.includes('manager') || lowerType.includes('management')) return 'property-manager';
    if (lowerType.includes('small') || lowerType.includes('local')) return 'small-company';
    return 'individual';
  }
  
  private inferMarketPosition(currentRent: number, targetRent: number): 'below' | 'at' | 'above' | 'significantly-above' {
    const difference = currentRent - targetRent;
    const percentage = (difference / currentRent) * 100;
    
    if (percentage >= 15) return 'significantly-above';
    if (percentage >= 5) return 'above';
    if (percentage <= -5) return 'below';
    return 'at';
  }
}

export const negotiationRoadmapClient = new NegotiationRoadmapClientService();