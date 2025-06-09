
import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Loader2, Building, Target } from "lucide-react";
import { PropertyDetails } from "@/shared/types/comparison";
import { toast } from "@/shared/hooks/use-toast";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import EnhancedPropertyInput, { type PropertyInputResult } from "@/components/property/EnhancedPropertyInput";
import { supabase } from "@/integrations/supabase/client";

interface PropertyInputFormProps {
  onSubmit: (properties: PropertyDetails[]) => void;
  isLoading: boolean;
}

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [userId, setUserId] = useState<string | undefined>();

  // Get user ID for memory integration
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    getUserId();
  }, []);

  // Handle property extraction from enhanced input
  const handlePropertyExtracted = (result: PropertyInputResult) => {
    console.log('🏠 Property extracted via:', result.inputMethod);

    // Check if we've reached the maximum properties limit
    if (properties.length >= 4) {
      toast({
        title: "Maximum Properties Reached",
        description: "You can compare up to 4 properties. Please remove one to add another.",
        variant: "destructive",
      });
      return;
    }

    // Convert UnifiedPropertyData to PropertyDetails format
    const property: PropertyDetails = {
      address: result.propertyData.address,
      zipCode: result.propertyData.zipcode,
      bedrooms: typeof result.propertyData.beds === 'number' 
        ? result.propertyData.beds 
        : parseInt(result.propertyData.beds?.toString() || '0'),
      bathrooms: typeof result.propertyData.baths === 'number' 
        ? result.propertyData.baths 
        : parseFloat(result.propertyData.baths?.toString() || '0'),
      squareFootage: typeof result.propertyData.sqft === 'number' 
        ? result.propertyData.sqft 
        : parseInt(result.propertyData.sqft?.toString() || '0'),
      price: result.propertyData.rent,
      propertyType: result.propertyData.propertyName,
      url: result.propertyData.sourceUrl,
      // Enhanced data from unified service
      marketAnalysis: {
        verdict: result.propertyData.verdict,
        marketAverage: result.propertyData.marketAverage,
        deltaPercent: result.propertyData.deltaPercent,
        rentcastAnalysis: result.propertyData.rentcastAnalysis,
        scrapingMethod: result.propertyData.scrapingMethod,
        unitId: result.propertyData.unitId
      }
    };

    // Add to properties list
    setProperties(prev => [...prev, property]);

    // Success message with method info
    const methodText = {
      'url_extraction': 'Auto-extracted from URL',
      'manual_input': 'Manually entered',
      'assisted_input': 'Auto-extracted + completed manually'
    }[result.inputMethod];

    toast({
      title: "Property Added Successfully",
      description: `${property.address} (${methodText})${property.marketAnalysis?.verdict && property.marketAnalysis.verdict !== 'unknown' ? ` - ${property.marketAnalysis.verdict}` : ''}`,
    });
  };

  const handleRemoveProperty = (index: number) => {
    const removedProperty = properties[index];
    const newProperties = [...properties];
    newProperties.splice(index, 1);
    setProperties(newProperties);

    toast({
      title: "Property Removed",
      description: `Removed ${removedProperty.address}`,
    });
  };

  const handleSubmit = () => {
    // Validate property data before submission
    if (properties.length < 2) {
      toast({
        title: "More Properties Needed",
        description: "Please add at least 2 properties to compare",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting enhanced property comparison with', properties.length, 'properties');
    onSubmit(properties);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Property Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Add Properties for Comparison
          </CardTitle>
          <CardDescription>
            100% success rate with auto-extraction, fallback assistance, and market analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedPropertyInput
            onPropertyExtracted={handlePropertyExtracted}
            placeholder="Enter property URL or address for guaranteed analysis..."
            title="Property Input"
            userId={userId}
          />
        </CardContent>
      </Card>

      {/* Properties List */}
      {properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Properties to Compare ({properties.length}/4)
              </span>
              {properties.length >= 2 && (
                <Badge variant="default">Ready to Compare</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {properties.map((property, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-background/50">
                  <Building className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-medium truncate">{property.address}</p>
                      {property.propertyType && (
                        <p className="text-sm text-muted-foreground">{property.propertyType}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {property.price > 0 && (
                        <Badge variant="default" className="text-xs">
                          ${property.price.toLocaleString()}/mo
                        </Badge>
                      )}
                      {property.bedrooms > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {property.bedrooms} bed
                        </Badge>
                      )}
                      {property.bathrooms > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {property.bathrooms} bath
                        </Badge>
                      )}
                      {property.squareFootage > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {property.squareFootage.toLocaleString()} sqft
                        </Badge>
                      )}
                    </div>

                    {/* Enhanced market analysis display */}
                    {property.marketAnalysis?.verdict && property.marketAnalysis.verdict !== 'unknown' && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge 
                          variant={
                            property.marketAnalysis.verdict === 'under-priced' ? 'default' :
                            property.marketAnalysis.verdict === 'over-priced' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {property.marketAnalysis.verdict}
                        </Badge>
                        {property.marketAnalysis.deltaPercent && (
                          <span className="text-muted-foreground">
                            {property.marketAnalysis.deltaPercent}% vs market
                          </span>
                        )}
                        {property.marketAnalysis.rentcastAnalysis?.comparables && (
                          <span className="text-muted-foreground">
                            • {property.marketAnalysis.rentcastAnalysis.comparables.length} comparables
                          </span>
                        )}
                      </div>
                    )}

                    {property.marketAnalysis?.unitId && (
                      <div className="text-xs text-muted-foreground">
                        Unit ID: {property.marketAnalysis.unitId}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleRemoveProperty(index)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Action */}
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || properties.length < 2}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing {properties.length} Properties...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Compare {properties.length} Properties
            </>
          )}
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {properties.length === 0 && "Add 2-4 properties to start comparison"}
            {properties.length === 1 && "Add 1 more property to enable comparison"}
            {properties.length >= 2 && `Ready to compare ${properties.length} properties with enhanced market data`}
          </p>
        </div>
      </div>
    </div>
  );
}
