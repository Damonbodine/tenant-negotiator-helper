import { NegotiationRoadmapData } from '@/shared/types/artifacts';

// Core types for the negotiation engine
export interface UserContext {
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
}

export interface MarketContext {
  currentRentVsMarket: 'below' | 'at' | 'above' | 'significantly-above';
  marketPosition: number; // percentile
  propertyCondition: 'excellent' | 'good' | 'fair' | 'needs-work';
  landlordType: 'individual' | 'small-company' | 'corporate' | 'property-manager';
  localVacancyRate: number;
  rentTrend: 'increasing' | 'stable' | 'decreasing';
  seasonalFactor: 'peak' | 'normal' | 'slow';
  economicIndicators: 'strong' | 'stable' | 'uncertain' | 'declining';
  comparableRange: { min: number; max: number; median: number };
  negotiationLeverage: 'low' | 'moderate' | 'high';
  marketPowerBalance: 'landlord-favored' | 'balanced' | 'tenant-favored';
}

export interface SituationContext {
  leaseStatus: 'pre-application' | 'application-pending' | 'active-lease' | 'renewal-period';
  timeUntilDecision: number; // days
  primaryGoal: 'rent-reduction' | 'amenity-addition' | 'lease-terms' | 'maintenance-issues';
  targetReduction: number;
  competingOffers: boolean;
  lifeEvents: 'job-change' | 'income-reduction' | 'family-change' | 'none';
  marketEvent: 'new-competition' | 'area-development' | 'economic-shift' | 'none';
}

type StrategyType = 'assertive_collaborative' | 'strategic_patience' | 'relationship_building' | 'collaborative_approach' | 'leverage_focused';

export class NegotiationEngineService {
  
  /**
   * Main entry point for generating a personalized negotiation roadmap
   */
  async generateRoadmap(
    userContext: UserContext,
    marketContext: MarketContext,
    situationContext: SituationContext
  ): Promise<NegotiationRoadmapData> {
    // 1. Calculate leverage score
    const leverageScore = this.calculateLeverageScore(userContext, marketContext, situationContext);
    
    // 2. Assess relationship risk
    const relationshipRisk = this.assessRelationshipRisk(userContext, situationContext);
    
    // 3. Evaluate market timing
    const marketTiming = this.evaluateMarketTiming(marketContext, situationContext);
    
    // 4. Select primary strategy
    const strategy = this.selectPrimaryStrategy(leverageScore, relationshipRisk, marketTiming, userContext);
    
    // 5. Calculate success probability
    const successProbability = this.calculateSuccessProbability(leverageScore, strategy, marketContext, userContext);
    
    // 6. Generate timeline and phases
    const timeline = this.generateTimeline(strategy, situationContext, userContext);
    
    // 7. Create detailed steps
    const steps = this.generateDetailedSteps(strategy, timeline, leverageScore, userContext, marketContext);
    
    // 8. Generate real-time guidance
    const guidance = this.generateGuidance(strategy, leverageScore, marketContext, situationContext);
    
    return {
      strategy: {
        type: strategy.type,
        name: strategy.name,
        description: strategy.description,
        reasoning: strategy.reasoning
      },
      successProbability,
      leverageScore,
      timeline,
      steps,
      ...guidance,
      marketContext: {
        currentRent: userContext.currentRent,
        targetRent: userContext.currentRent - situationContext.targetReduction,
        marketPosition: marketContext.currentRentVsMarket,
        comparableRange: marketContext.comparableRange,
        negotiationRoom: this.calculateNegotiationRoom(marketContext, leverageScore)
      },
      adaptationTriggers: this.generateAdaptationTriggers(strategy, leverageScore, marketContext)
    };
  }

  /**
   * Calculate overall leverage score (0-10)
   */
  private calculateLeverageScore(
    userContext: UserContext,
    marketContext: MarketContext,
    situationContext: SituationContext
  ): typeof NegotiationRoadmapData.prototype.leverageScore {
    // Market factors (40% weight)
    const marketScore = this.calculateMarketLeverage(marketContext) * 0.4;
    
    // Financial factors (25% weight)
    const financialScore = this.calculateFinancialLeverage(userContext) * 0.25;
    
    // Relationship factors (20% weight)
    const relationshipScore = this.calculateRelationshipLeverage(userContext) * 0.2;
    
    // Timing factors (15% weight)
    const timingScore = this.calculateTimingLeverage(situationContext, marketContext) * 0.15;
    
    const total = Math.round((marketScore + financialScore + relationshipScore + timingScore) * 10) / 10;
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Identify key strengths and weaknesses
    if (marketScore / 0.4 >= 7) strengths.push('Strong market position');
    if (financialScore / 0.25 >= 7) strengths.push('Financial stability');
    if (relationshipScore / 0.2 >= 7) strengths.push('Good landlord relationship');
    if (timingScore / 0.15 >= 7) strengths.push('Optimal timing');
    
    if (marketScore / 0.4 <= 3) weaknesses.push('Weak market position');
    if (financialScore / 0.25 <= 3) weaknesses.push('Financial constraints');
    if (relationshipScore / 0.2 <= 3) weaknesses.push('Strained relationship');
    if (timingScore / 0.15 <= 3) weaknesses.push('Poor timing');
    
    return {
      total,
      factors: {
        market: Math.round((marketScore / 0.4) * 10) / 10,
        financial: Math.round((financialScore / 0.25) * 10) / 10,
        relationship: Math.round((relationshipScore / 0.2) * 10) / 10,
        timing: Math.round((timingScore / 0.15) * 10) / 10
      },
      strengths,
      weaknesses
    };
  }

  private calculateMarketLeverage(marketContext: MarketContext): number {
    let score = 5; // baseline
    
    // Market position
    if (marketContext.currentRentVsMarket === 'significantly-above') score += 3;
    else if (marketContext.currentRentVsMarket === 'above') score += 2;
    else if (marketContext.currentRentVsMarket === 'below') score -= 1;
    
    // Vacancy rate
    if (marketContext.localVacancyRate > 7) score += 2;
    else if (marketContext.localVacancyRate > 5) score += 1;
    else if (marketContext.localVacancyRate < 3) score -= 2;
    
    // Rent trend
    if (marketContext.rentTrend === 'decreasing') score += 2;
    else if (marketContext.rentTrend === 'increasing') score -= 1;
    
    // Market power balance
    if (marketContext.marketPowerBalance === 'tenant-favored') score += 2;
    else if (marketContext.marketPowerBalance === 'landlord-favored') score -= 2;
    
    return Math.max(0, Math.min(10, score));
  }

  private calculateFinancialLeverage(userContext: UserContext): number {
    let score = 5; // baseline
    
    // Budget flexibility
    if (userContext.budgetFlexibility === 'flexible') score += 2;
    else if (userContext.budgetFlexibility === 'tight') score -= 2;
    
    // Employment stability
    if (userContext.employmentStability === 'stable') score += 1;
    else if (userContext.employmentStability === 'unstable') score -= 2;
    
    // Alternative options
    if (userContext.alternativeOptions >= 3) score += 2;
    else if (userContext.alternativeOptions === 0) score -= 2;
    
    // Moving flexibility
    if (userContext.movingFlexibility === 'eager-to-move') score += 1;
    else if (userContext.movingFlexibility === 'committed-to-stay') score -= 1;
    
    return Math.max(0, Math.min(10, score));
  }

  private calculateRelationshipLeverage(userContext: UserContext): number {
    let score = 5; // baseline
    
    // Landlord relationship
    if (userContext.landlordRelationship === 'positive') score += 3;
    else if (userContext.landlordRelationship === 'neutral') score += 1;
    else if (userContext.landlordRelationship === 'strained') score -= 3;
    
    // Tenant history
    if (userContext.tenantHistory === 'veteran') score += 2;
    else if (userContext.tenantHistory === 'experienced') score += 1;
    else if (userContext.tenantHistory === 'first-time') score -= 1;
    
    return Math.max(0, Math.min(10, score));
  }

  private calculateTimingLeverage(situationContext: SituationContext, marketContext: MarketContext): number {
    let score = 5; // baseline
    
    // Seasonal factor
    if (marketContext.seasonalFactor === 'slow') score += 2;
    else if (marketContext.seasonalFactor === 'peak') score -= 1;
    
    // Time pressure
    if (situationContext.timeUntilDecision > 30) score += 1;
    else if (situationContext.timeUntilDecision < 7) score -= 2;
    
    // Lease status
    if (situationContext.leaseStatus === 'renewal-period') score += 1;
    else if (situationContext.leaseStatus === 'pre-application') score -= 1;
    
    return Math.max(0, Math.min(10, score));
  }

  private assessRelationshipRisk(userContext: UserContext, situationContext: SituationContext): number {
    let risk = 5; // baseline moderate risk
    
    if (userContext.landlordRelationship === 'strained') risk += 3;
    if (userContext.conflictStyle === 'avoider') risk += 2;
    if (situationContext.primaryGoal === 'rent-reduction' && userContext.riskTolerance === 'conservative') risk += 1;
    
    return Math.max(0, Math.min(10, risk));
  }

  private evaluateMarketTiming(marketContext: MarketContext, situationContext: SituationContext): 'favorable' | 'neutral' | 'unfavorable' {
    let score = 0;
    
    if (marketContext.rentTrend === 'decreasing') score += 2;
    if (marketContext.localVacancyRate > 5) score += 1;
    if (marketContext.seasonalFactor === 'slow') score += 1;
    if (situationContext.timeUntilDecision > 30) score += 1;
    
    if (score >= 3) return 'favorable';
    if (score <= 1) return 'unfavorable';
    return 'neutral';
  }

  private selectPrimaryStrategy(
    leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore,
    relationshipRisk: number,
    marketTiming: 'favorable' | 'neutral' | 'unfavorable',
    userContext: UserContext
  ): { type: StrategyType; name: string; description: string; reasoning: string } {
    
    if (leverageScore.total >= 7 && relationshipRisk < 4) {
      return {
        type: 'assertive_collaborative',
        name: 'Assertive Collaborative',
        description: 'Confidently present market data while maintaining a collaborative tone',
        reasoning: 'High leverage with low relationship risk allows for direct negotiation'
      };
    }
    
    if (leverageScore.total >= 5 && marketTiming === 'favorable') {
      return {
        type: 'collaborative_approach',
        name: 'Collaborative Negotiation',
        description: 'Work together with landlord to find mutually beneficial solutions',
        reasoning: 'Moderate leverage with favorable timing supports collaborative approach'
      };
    }
    
    if (relationshipRisk >= 7 || leverageScore.total < 3) {
      return {
        type: 'relationship_building',
        name: 'Relationship Building',
        description: 'Focus on strengthening relationship before making requests',
        reasoning: 'Low leverage or high relationship risk requires foundation building'
      };
    }
    
    if (leverageScore.total >= 6 && userContext.riskTolerance === 'aggressive') {
      return {
        type: 'leverage_focused',
        name: 'Leverage-Focused',
        description: 'Use market position and alternatives to negotiate from strength',
        reasoning: 'Strong leverage with aggressive risk tolerance supports direct approach'
      };
    }
    
    return {
      type: 'strategic_patience',
      name: 'Strategic Patience',
      description: 'Build position over time and wait for optimal negotiation window',
      reasoning: 'Current conditions favor building leverage before negotiating'
    };
  }

  private calculateSuccessProbability(
    leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore,
    strategy: { type: StrategyType },
    marketContext: MarketContext,
    userContext: UserContext
  ): typeof NegotiationRoadmapData.prototype.successProbability {
    
    // Base probability from leverage score
    let overall = Math.round(leverageScore.total * 7 + 30); // 30-100% range
    
    // Strategy adjustments
    const strategyModifiers = {
      'assertive_collaborative': 5,
      'collaborative_approach': 0,
      'relationship_building': -10,
      'leverage_focused': 10,
      'strategic_patience': -5
    };
    
    overall += strategyModifiers[strategy.type];
    
    // Market condition adjustments
    if (marketContext.currentRentVsMarket === 'significantly-above') overall += 15;
    if (marketContext.marketPowerBalance === 'tenant-favored') overall += 10;
    
    // User factor adjustments
    if (userContext.tenantHistory === 'veteran') overall += 5;
    if (userContext.landlordRelationship === 'positive') overall += 10;
    
    overall = Math.max(10, Math.min(95, overall));
    
    return {
      overall,
      breakdown: {
        marketConditions: Math.round(leverageScore.factors.market * 10),
        relationshipStrength: Math.round(leverageScore.factors.relationship * 10),
        timingOptimality: Math.round(leverageScore.factors.timing * 10),
        strategyAlignment: Math.round(overall * 0.8) // Strategy effectiveness
      },
      confidenceInterval: {
        min: Math.max(5, overall - 15),
        max: Math.min(100, overall + 10)
      }
    };
  }

  private generateTimeline(
    strategy: { type: StrategyType },
    situationContext: SituationContext,
    userContext: UserContext
  ): typeof NegotiationRoadmapData.prototype.timeline {
    
    const basePhases = this.getStrategyPhases(strategy.type);
    const timelineAdjustment = this.calculateTimelineAdjustment(situationContext, userContext);
    
    return {
      estimatedDuration: this.calculateDuration(strategy.type, timelineAdjustment),
      phases: basePhases.map((phase, index) => ({
        ...phase,
        status: index === 0 ? 'active' : 'pending'
      }))
    };
  }

  private getStrategyPhases(strategyType: StrategyType) {
    const phaseTemplates = {
      'assertive_collaborative': [
        { id: 1, name: 'Foundation Setting', duration: '2-3 days', description: 'Gather market data and prepare compelling case' },
        { id: 2, name: 'Initial Approach', duration: '1 week', description: 'Present request with market evidence' },
        { id: 3, name: 'Collaborative Resolution', duration: '1-2 weeks', description: 'Work together to find mutually beneficial solution' }
      ],
      'strategic_patience': [
        { id: 1, name: 'Intelligence Gathering', duration: '2-3 weeks', description: 'Monitor market and build relationship' },
        { id: 2, name: 'Position Building', duration: '3-4 weeks', description: 'Strengthen leverage and demonstrate value' },
        { id: 3, name: 'Strategic Timing', duration: '1-2 weeks', description: 'Execute when conditions are optimal' }
      ],
      'relationship_building': [
        { id: 1, name: 'Relationship Repair', duration: '2-4 weeks', description: 'Address issues and rebuild trust' },
        { id: 2, name: 'Value Demonstration', duration: '2-3 weeks', description: 'Show your worth as a tenant' },
        { id: 3, name: 'Gentle Approach', duration: '1-2 weeks', description: 'Make request from position of trust' }
      ],
      'collaborative_approach': [
        { id: 1, name: 'Collaborative Setup', duration: '3-5 days', description: 'Frame as joint problem-solving' },
        { id: 2, name: 'Mutual Exploration', duration: '1-2 weeks', description: 'Explore options together' },
        { id: 3, name: 'Win-Win Solution', duration: '1 week', description: 'Finalize mutually beneficial agreement' }
      ],
      'leverage_focused': [
        { id: 1, name: 'Leverage Assessment', duration: '1-2 days', description: 'Document all negotiation advantages' },
        { id: 2, name: 'Direct Negotiation', duration: '3-5 days', description: 'Present case with clear alternatives' },
        { id: 3, name: 'Final Agreement', duration: '3-7 days', description: 'Secure commitment and formalize terms' }
      ]
    };
    
    return phaseTemplates[strategyType] || phaseTemplates['collaborative_approach'];
  }

  private calculateTimelineAdjustment(situationContext: SituationContext, userContext: UserContext): number {
    let adjustment = 1.0;
    
    if (situationContext.timeUntilDecision < 14) adjustment *= 0.7; // Accelerate
    if (userContext.urgency === 'urgent') adjustment *= 0.8;
    if (userContext.landlordRelationship === 'strained') adjustment *= 1.3; // Slow down
    
    return adjustment;
  }

  private calculateDuration(strategyType: StrategyType, adjustment: number): string {
    const baseDurations = {
      'assertive_collaborative': 14,
      'strategic_patience': 56,
      'relationship_building': 42,
      'collaborative_approach': 21,
      'leverage_focused': 10
    };
    
    const adjustedDays = Math.round((baseDurations[strategyType] || 21) * adjustment);
    
    if (adjustedDays <= 7) return `${adjustedDays} days`;
    if (adjustedDays <= 28) return `${Math.round(adjustedDays / 7)} weeks`;
    return `${Math.round(adjustedDays / 30)} months`;
  }

  private generateDetailedSteps(
    strategy: { type: StrategyType },
    timeline: typeof NegotiationRoadmapData.prototype.timeline,
    leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore,
    userContext: UserContext,
    marketContext: MarketContext
  ): typeof NegotiationRoadmapData.prototype.steps {
    
    const stepTemplates = this.getStepTemplates(strategy.type);
    
    return stepTemplates.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending',
      actionItems: this.customizeActionItems(step.actionItems, leverageScore, userContext, marketContext),
      tips: this.customizeTips(step.tips, userContext),
      templates: step.templates ? this.generateTemplates(step.templates, userContext, marketContext) : undefined
    }));
  }

  private getStepTemplates(strategyType: StrategyType) {
    // This would contain detailed step templates for each strategy
    // For brevity, returning a simplified example
    return [
      {
        id: 1,
        phase: 1,
        title: 'Market Research',
        description: 'Gather comparable property data to support your negotiation',
        difficulty: 'easy' as const,
        estimatedTime: '2-3 hours',
        actionItems: [
          { type: 'research' as const, description: 'Find 3-5 comparable properties', automated: true, priority: 'high' as const },
          { type: 'document' as const, description: 'Create comparison summary', automated: false, priority: 'high' as const }
        ],
        successMetrics: ['Clear rent difference established', 'Compelling evidence gathered'],
        tips: ['Focus on similar properties within 0.5 miles', 'Include only active listings from last 30 days'],
        riskFactors: ['Don\'t overwhelm with too much data'],
        templates: { email: 'market_research_email' }
      },
      {
        id: 2,
        phase: 1,
        title: 'Approach Planning',
        description: 'Plan your communication strategy and timing',
        difficulty: 'medium' as const,
        estimatedTime: '1 hour',
        actionItems: [
          { type: 'analyze' as const, description: 'Review landlord communication patterns', automated: false, priority: 'medium' as const },
          { type: 'document' as const, description: 'Draft initial request', automated: false, priority: 'high' as const }
        ],
        successMetrics: ['Clear communication plan', 'Appropriate tone selected'],
        tips: ['Consider landlord\'s preferred communication method', 'Choose timing when they\'re not stressed'],
        riskFactors: ['Avoid approaching during busy periods'],
        templates: { email: 'initial_request_email', phoneScript: 'initial_request_script' }
      }
    ];
  }

  private customizeActionItems(
    actionItems: any[],
    leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore,
    userContext: UserContext,
    marketContext: MarketContext
  ) {
    // Customize action items based on context
    return actionItems.map(item => {
      if (item.type === 'research' && leverageScore.factors.market < 5) {
        return { ...item, description: 'Find 5-7 comparable properties (more needed due to weak market position)' };
      }
      return item;
    });
  }

  private customizeTips(tips: string[], userContext: UserContext): string[] {
    // Customize tips based on user context
    const customized = [...tips];
    
    if (userContext.tenantHistory === 'first-time') {
      customized.push('As a first-time renter, emphasize your stability and reliability');
    }
    
    if (userContext.landlordRelationship === 'strained') {
      customized.push('Focus on rebuilding trust before making requests');
    }
    
    return customized;
  }

  private generateTemplates(templateIds: any, userContext: UserContext, marketContext: MarketContext) {
    // Generate actual email/script content based on context
    return {
      email: this.generateEmailTemplate(templateIds.email, userContext, marketContext),
      phoneScript: templateIds.phoneScript ? this.generatePhoneScript(templateIds.phoneScript, userContext) : undefined,
      followUp: templateIds.followUp ? this.generateFollowUpTemplate(templateIds.followUp, userContext) : undefined
    };
  }

  private generateEmailTemplate(templateId: string, userContext: UserContext, marketContext: MarketContext): string {
    // Generate contextual email templates
    const tone = userContext.preferredTone === 'diplomatic' ? 'respectful and diplomatic' : 'direct but professional';
    
    return `Subject: Request to Discuss Rent Adjustment

Dear [Landlord Name],

I hope this email finds you well. I wanted to reach out regarding my current lease and discuss the possibility of a rent adjustment.

[Market data section would be customized based on marketContext]

I value our landlord-tenant relationship and would appreciate the opportunity to discuss this further.

Best regards,
[Your name]`;
  }

  private generatePhoneScript(templateId: string, userContext: UserContext): string {
    return `Phone Script for ${userContext.preferredTone} approach...`;
  }

  private generateFollowUpTemplate(templateId: string, userContext: UserContext): string {
    return `Follow-up template for ${userContext.preferredTone} communication...`;
  }

  private generateGuidance(
    strategy: { type: StrategyType },
    leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore,
    marketContext: MarketContext,
    situationContext: SituationContext
  ) {
    const currentRecommendations: string[] = [];
    const warningFlags: string[] = [];
    const opportunityAlerts: string[] = [];
    const nextBestActions: string[] = [];

    // Generate contextual guidance
    if (leverageScore.total >= 7) {
      currentRecommendations.push('Your strong leverage position allows for confident negotiation');
      nextBestActions.push('Prepare market research showing rent comparisons');
    }

    if (marketContext.currentRentVsMarket === 'significantly-above') {
      opportunityAlerts.push('Your rent is significantly above market - strong negotiation opportunity');
    }

    if (situationContext.timeUntilDecision < 7) {
      warningFlags.push('Limited time may reduce negotiation flexibility');
    }

    if (marketContext.rentTrend === 'decreasing') {
      opportunityAlerts.push('Declining rent trend supports your negotiation position');
    }

    return {
      currentRecommendations,
      warningFlags,
      opportunityAlerts,
      nextBestActions
    };
  }

  private calculateNegotiationRoom(marketContext: MarketContext, leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore): number {
    let baseRoom = 5; // 5% baseline
    
    if (marketContext.currentRentVsMarket === 'significantly-above') baseRoom = 15;
    else if (marketContext.currentRentVsMarket === 'above') baseRoom = 10;
    else if (marketContext.currentRentVsMarket === 'below') baseRoom = 2;
    
    // Adjust based on leverage
    const leverageMultiplier = leverageScore.total / 10;
    
    return Math.round(baseRoom * leverageMultiplier);
  }

  private generateAdaptationTriggers(
    strategy: { type: StrategyType },
    leverageScore: typeof NegotiationRoadmapData.prototype.leverageScore,
    marketContext: MarketContext
  ): typeof NegotiationRoadmapData.prototype.adaptationTriggers {
    return [
      {
        condition: 'Landlord responds defensively to market data',
        suggestedAdjustment: 'Shift to relationship-focused approach',
        impact: 'moderate'
      },
      {
        condition: 'New comparable properties listed at lower rents',
        suggestedAdjustment: 'Update market research and increase target reduction',
        impact: 'major'
      },
      {
        condition: 'Market conditions improve significantly',
        suggestedAdjustment: 'Accelerate timeline and increase assertiveness',
        impact: 'moderate'
      }
    ];
  }
}

// Export singleton instance
export const negotiationEngine = new NegotiationEngineService();