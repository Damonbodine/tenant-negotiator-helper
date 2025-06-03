// Rental Negotiation Memory Service
// Service layer for the rental negotiation AI chat memory architecture

import { createClient } from '@supabase/supabase-js';

// Types for the rental negotiation system
export interface UserRentalProfile {
  id: string;
  location?: string;
  current_situation?: 'searching' | 'renewal' | 'current_tenant' | 'relocating';
  budget_range_min?: number;
  budget_range_max?: number;
  total_properties_analyzed: number;
  total_conversations: number;
  negotiation_experience_level: 'beginner' | 'intermediate' | 'expert';
  preferred_communication_style: string;
  ai_context_preferences: Record<string, any>;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  property_type?: 'apartment' | 'house' | 'condo' | 'townhouse' | 'other';
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  rent_amount?: number; // in cents
  listing_url?: string;
  listing_source?: string;
  market_analysis?: Record<string, any>;
  comparable_properties?: Record<string, any>;
  negotiation_insights?: Record<string, any>;
  confidence_score?: number;
}

export interface UserPropertyRelationship {
  id: string;
  user_id: string;
  property_id: string;
  relationship_type: 'target' | 'current' | 'comparable' | 'analyzed' | 'rejected';
  user_notes?: string;
  priority_level: number;
  status: 'active' | 'archived' | 'completed';
  user_target_rent?: number;
  user_max_rent?: number;
  negotiation_status?: 'not_started' | 'in_progress' | 'successful' | 'failed' | 'withdrawn';
  actual_negotiated_rent?: number;
}

export interface RentalConversation {
  id: string;
  user_id: string;
  conversation_type: 'listing_analyzer' | 'comparables' | 'negotiation_help' | 'voice_chat' | 'email_script_builder' | 'price_analysis' | 'general_advice';
  title?: string;
  status: 'active' | 'completed' | 'archived';
  primary_property_id?: string;
  conversation_intent?: Record<string, any>;
  context_properties: string[];
  context_summary?: string;
  key_insights: any[];
  action_items: any[];
  follow_up_needed: boolean;
  user_satisfaction_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface RentalMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'analysis' | 'comparison' | 'recommendation' | 'template';
  token_count?: number;
  processing_time_ms?: number;
  model_used?: string;
  referenced_properties: string[];
  generated_insights?: Record<string, any>;
  parent_message_id?: string;
  created_at: string;
}

export interface RentalAnalysis {
  id: string;
  user_id: string;
  analysis_type: 'single_property' | 'comparative' | 'market_trend' | 'negotiation_strategy' | 'price_analysis';
  primary_property_id?: string;
  compared_properties: string[];
  analysis_results: Record<string, any>;
  confidence_score?: number;
  summary?: string;
  recommendations: any[];
  talking_points: any[];
  conversation_id?: string;
  reused_count: number;
  user_feedback_rating?: number;
  accuracy_validated: boolean;
  created_at: string;
}

export interface ConversationContext {
  conversation_info: {
    id: string;
    type: string;
    title?: string;
    primary_property_id?: string;
    context_properties: string[];
  };
  user_context: {
    target_properties: Property[];
    comparable_properties: Property[];
    analysis_history: RentalAnalysis[];
    user_profile: UserRentalProfile;
  };
  conversation_history: RentalMessage[];
  relevant_analyses: RentalAnalysis[];
  primary_property_details?: Property;
}

class RentalMemoryService {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  // =============================================
  // USER PROFILE MANAGEMENT
  // =============================================

  async createUserProfile(userId: string, profileData: Partial<UserRentalProfile>): Promise<UserRentalProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles_rental')
      .insert({
        id: userId,
        ...profileData
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user profile: ${error.message}`);
    return data;
  }

  async getUserProfile(userId: string): Promise<UserRentalProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles_rental')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserRentalProfile>): Promise<UserRentalProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles_rental')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user profile: ${error.message}`);
    return data;
  }

  // =============================================
  // PROPERTY MANAGEMENT
  // =============================================

  async addProperty(propertyData: Omit<Property, 'id'>): Promise<Property> {
    const { data, error } = await this.supabase
      .from('properties')
      .upsert({
        ...propertyData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add property: ${error.message}`);
    return data;
  }

  async linkUserToProperty(
    userId: string, 
    propertyId: string, 
    relationshipData: Omit<UserPropertyRelationship, 'id' | 'user_id' | 'property_id'>
  ): Promise<UserPropertyRelationship> {
    const { data, error } = await this.supabase
      .from('user_properties')
      .upsert({
        user_id: userId,
        property_id: propertyId,
        ...relationshipData
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to link user to property: ${error.message}`);
    return data;
  }

  async getUserProperties(userId: string, relationshipType?: string): Promise<(Property & UserPropertyRelationship)[]> {
    let query = this.supabase
      .from('user_properties')
      .select(`
        *,
        properties:property_id (*)
      `)
      .eq('user_id', userId);

    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get user properties: ${error.message}`);
    
    return data.map((item: any) => ({
      ...item.properties,
      ...item
    }));
  }

  // =============================================
  // CONVERSATION MANAGEMENT
  // =============================================

  async createConversation(conversationData: Omit<RentalConversation, 'id' | 'created_at' | 'updated_at'>): Promise<RentalConversation> {
    const { data, error } = await this.supabase
      .from('rental_conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    return data;
  }

  async addMessage(messageData: Omit<RentalMessage, 'id' | 'created_at'>): Promise<RentalMessage> {
    const { data, error } = await this.supabase
      .from('rental_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw new Error(`Failed to add message: ${error.message}`);
    return data;
  }

  async getConversationContext(conversationId: string): Promise<ConversationContext> {
    const { data, error } = await this.supabase
      .rpc('build_conversation_context', { p_conversation_id: conversationId });

    if (error) throw new Error(`Failed to get conversation context: ${error.message}`);
    return data;
  }

  async getUserRecentConversations(userId: string, limit: number = 5): Promise<any[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_recent_conversations', { 
        p_user_id: userId, 
        conversation_limit: limit 
      });

    if (error) throw new Error(`Failed to get recent conversations: ${error.message}`);
    return data;
  }

  // =============================================
  // ANALYSIS MANAGEMENT
  // =============================================

  async saveAnalysis(analysisData: Omit<RentalAnalysis, 'id' | 'created_at'>): Promise<RentalAnalysis> {
    const { data, error } = await this.supabase
      .from('rental_analyses')
      .insert(analysisData)
      .select()
      .single();

    if (error) throw new Error(`Failed to save analysis: ${error.message}`);
    return data;
  }

  async getUserAnalyses(userId: string, analysisType?: string): Promise<RentalAnalysis[]> {
    let query = this.supabase
      .from('rental_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get user analyses: ${error.message}`);
    return data;
  }

  async incrementAnalysisReuse(analysisId: string): Promise<void> {
    const { error } = await this.supabase
      .from('rental_analyses')
      .update({ 
        reused_count: this.supabase.sql`reused_count + 1` 
      })
      .eq('id', analysisId);

    if (error) throw new Error(`Failed to increment analysis reuse: ${error.message}`);
  }

  // =============================================
  // CONTEXT BUILDING FOR AI
  // =============================================

  async buildAIContext(userId: string, conversationId?: string): Promise<any> {
    if (conversationId) {
      return await this.getConversationContext(conversationId);
    }

    // Build general user context
    const { data, error } = await this.supabase
      .rpc('get_user_property_context', { p_user_id: userId });

    if (error) throw new Error(`Failed to build AI context: ${error.message}`);
    return data;
  }

  // =============================================
  // SEARCH AND DISCOVERY
  // =============================================

  async searchSimilarProperties(
    queryVector: number[], 
    userId?: string, 
    threshold: number = 0.7, 
    limit: number = 10
  ): Promise<any[]> {
    const { data, error } = await this.supabase
      .rpc('search_similar_properties', {
        query_vector: queryVector,
        p_user_id: userId,
        similarity_threshold: threshold,
        result_limit: limit
      });

    if (error) throw new Error(`Failed to search similar properties: ${error.message}`);
    return data;
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  async updateNegotiationStatus(
    userId: string, 
    propertyId: string, 
    status: string, 
    finalRent?: number
  ): Promise<void> {
    const updateData: any = { negotiation_status: status };
    if (finalRent) {
      updateData.actual_negotiated_rent = finalRent;
    }

    const { error } = await this.supabase
      .from('user_properties')
      .update(updateData)
      .eq('user_id', userId)
      .eq('property_id', propertyId);

    if (error) throw new Error(`Failed to update negotiation status: ${error.message}`);
  }

  async completeConversation(conversationId: string, rating?: number): Promise<void> {
    const updateData: any = { 
      status: 'completed',
      updated_at: new Date().toISOString()
    };
    
    if (rating) {
      updateData.user_satisfaction_rating = rating;
    }

    const { error } = await this.supabase
      .from('rental_conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (error) throw new Error(`Failed to complete conversation: ${error.message}`);
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  async addPropertyWithAnalysis(
    userId: string,
    propertyData: Omit<Property, 'id'>,
    relationshipType: string,
    analysisResults: Record<string, any>
  ): Promise<{ property: Property; relationship: UserPropertyRelationship; analysis: RentalAnalysis }> {
    // Add property
    const property = await this.addProperty(propertyData);

    // Link to user
    const relationship = await this.linkUserToProperty(userId, property.id, {
      relationship_type: relationshipType as any,
      priority_level: 1,
      status: 'active'
    });

    // Save analysis
    const analysis = await this.saveAnalysis({
      user_id: userId,
      analysis_type: 'single_property',
      primary_property_id: property.id,
      compared_properties: [],
      analysis_results: analysisResults,
      summary: analysisResults.summary,
      recommendations: analysisResults.recommendations || [],
      talking_points: analysisResults.talking_points || [],
      reused_count: 0,
      accuracy_validated: false
    });

    return { property, relationship, analysis };
  }
}

export default RentalMemoryService; 