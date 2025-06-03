-- Fix GROUP BY issue in get_user_property_context function

CREATE OR REPLACE FUNCTION get_user_property_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    context JSONB := '{}';
BEGIN
    SELECT jsonb_build_object(
        'target_properties', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'property_id', p.id,
                'address', p.address,
                'city', p.city,
                'state', p.state,
                'rent_amount', p.rent_amount,
                'user_target_rent', up.user_target_rent,
                'relationship_type', up.relationship_type,
                'priority_level', up.priority_level,
                'negotiation_status', up.negotiation_status
            )), '[]'::jsonb)
            FROM properties p
            JOIN user_properties up ON p.id = up.property_id
            WHERE up.user_id = p_user_id AND up.relationship_type = 'target' AND up.status = 'active'
        ),
        'comparable_properties', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'property_id', p.id,
                'address', p.address,
                'city', p.city,
                'rent_amount', p.rent_amount,
                'property_type', p.property_type
            )), '[]'::jsonb)
            FROM properties p
            JOIN user_properties up ON p.id = up.property_id
            WHERE up.user_id = p_user_id AND up.relationship_type = 'comparable'
        ),
        'analysis_history', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'analysis_id', ra.id,
                    'analysis_type', ra.analysis_type,
                    'summary', ra.summary,
                    'confidence_score', ra.confidence_score,
                    'created_at', ra.created_at
                )
                ORDER BY ra.created_at DESC
            ), '[]'::jsonb)
            FROM rental_analyses ra
            WHERE ra.user_id = p_user_id
            LIMIT 10
        ),
        'user_profile', (
            SELECT jsonb_build_object(
                'location', location,
                'current_situation', current_situation,
                'budget_range_min', budget_range_min,
                'budget_range_max', budget_range_max,
                'negotiation_experience_level', negotiation_experience_level,
                'preferred_communication_style', preferred_communication_style
            )
            FROM user_profiles_rental
            WHERE id = p_user_id
        )
    ) INTO context;
    
    RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 