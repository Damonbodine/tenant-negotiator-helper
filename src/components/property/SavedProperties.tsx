import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Home, MapPin, DollarSign, Bed, Bath, Square, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface SavedProperty {
  id: string;
  address: string;
  property_name?: string;
  rent_amount: number; // in cents
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  zip_code?: string;
  source_url?: string;
  market_verdict?: 'under-priced' | 'over-priced' | 'priced right' | 'unknown';
  market_average_rent?: number; // in cents
  price_difference_percent?: number;
  created_at: string;
}

interface SavedPropertiesProps {
  embedded?: boolean;
  onPropertySelect?: (property: SavedProperty) => void;
}

export const SavedProperties: React.FC<SavedPropertiesProps> = ({ 
  embedded = false, 
  onPropertySelect 
}) => {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchSavedProperties();
    }
  }, [session?.user]);

  const fetchSavedProperties = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('properties')
        .select(`
          id,
          address,
          property_name,
          rent_amount,
          bedrooms,
          bathrooms,
          square_footage,
          zip_code,
          source_url,
          market_verdict,
          market_average_rent,
          price_difference_percent,
          created_at,
          user_properties!inner(user_id)
        `)
        .eq('user_properties.user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching saved properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!session?.user) return;

    try {
      // Delete the user-property relationship
      const { error: deleteError } = await (supabase as any)
        .from('user_properties')
        .delete()
        .eq('user_id', session.user.id)
        .eq('property_id', propertyId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      
      toast({
        title: 'Property removed',
        description: 'Property has been removed from your saved list.',
      });
    } catch (err) {
      console.error('Error deleting property:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove property. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(cents / 100);
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'under-priced': return 'default';
      case 'over-priced': return 'destructive';
      case 'priced right': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your saved properties.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your saved properties...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-2">Error loading properties</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSavedProperties} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Saved Properties
        </CardTitle>
        <CardDescription>
          {properties.length === 0 
            ? 'Analyze some properties to see them here.'
            : `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} analyzed`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No properties saved yet</p>
            <p className="text-sm text-muted-foreground">
              Use the Market Insights or Property Comparison tools to analyze and save properties.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Property Name and Address */}
                    <div>
                      <h3 className="font-medium text-sm truncate">
                        {property.property_name || property.address}
                      </h3>
                      {property.property_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.address}
                        </p>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="default" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(property.rent_amount)}/mo
                      </Badge>
                      
                      {property.bedrooms > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Bed className="h-3 w-3 mr-1" />
                          {property.bedrooms}
                        </Badge>
                      )}
                      
                      {property.bathrooms > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Bath className="h-3 w-3 mr-1" />
                          {property.bathrooms}
                        </Badge>
                      )}
                      
                      {property.square_footage > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Square className="h-3 w-3 mr-1" />
                          {property.square_footage.toLocaleString()} sqft
                        </Badge>
                      )}
                    </div>

                    {/* Market Analysis */}
                    {property.market_verdict && property.market_verdict !== 'unknown' && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant={getVerdictColor(property.market_verdict)} className="text-xs">
                          {property.market_verdict}
                        </Badge>
                        {property.price_difference_percent && (
                          <span className="text-muted-foreground">
                            {property.price_difference_percent > 0 ? '+' : ''}{property.price_difference_percent.toFixed(1)}% vs market
                          </span>
                        )}
                      </div>
                    )}

                    {/* Analysis Date */}
                    <p className="text-xs text-muted-foreground">
                      Analyzed {formatDate(property.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {property.source_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(property.source_url, '_blank')}
                        title="View original listing"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteProperty(property.id)}
                      title="Remove property"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedProperties;