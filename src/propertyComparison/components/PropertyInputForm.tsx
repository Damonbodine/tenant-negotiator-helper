
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Plus, Trash, Building } from "lucide-react";
import { PropertyDetails } from "@/shared/types/comparison";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";
import { toast } from "@/shared/hooks/use-toast";
import { Badge } from "@/shared/ui/badge";

interface PropertyInputFormProps {
  onSubmit: (properties: PropertyDetails[]) => void;
  isLoading: boolean;
}

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [propertyInput, setPropertyInput] = useState<string>("");
  const [processingInput, setProcessingInput] = useState<boolean>(false);

  // URL regex pattern to detect if input is a URL
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor|hotpads)\.com\/[^\s]+)/i;

  const handlePropertyInput = async () => {
    const input = propertyInput.trim();
    
    if (!input) {
      toast({
        title: "Input Required",
        description: "Please enter a property URL or address",
        variant: "destructive",
      });
      return;
    }

    // Check if we've reached the maximum properties limit
    if (properties.length >= 4) {
      toast({
        title: "Maximum Properties Reached",
        description: "You can compare up to 4 properties. Please remove one to add another.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingInput(true);
    
    try {
      // Determine if input is a URL or address
      const isUrl = urlRegex.test(input);
      let propertyData;
      
      if (isUrl) {
        // Extract property details from URL
        propertyData = await analyzeListingWithSupabase(input);
      } else {
        // Process as address
        const addressResult = await analyzeAddressWithSupabase({ address: input });
        
        // Create a property from address analysis
        propertyData = {
          address: input,
          zipCode: input.match(/\b\d{5}\b/)?.[0] || "", // Try to extract zip code from the address
          // We'll leave numeric values as 0 since we don't have this data from plain address
          beds: 0,
          baths: 0,
          sqft: 0,
          rent: 0
        };
      }
      
      if (!propertyData.address) {
        throw new Error("Could not extract property details from this input");
      }

      // Map the extracted data to PropertyDetails format
      const extractedProperty: PropertyDetails = {
        address: propertyData.address || "",
        zipCode: propertyData.zipcode || "",
        bedrooms: typeof propertyData.beds === 'number' ? propertyData.beds : 0,
        bathrooms: typeof propertyData.baths === 'number' ? propertyData.baths : 0,
        squareFootage: typeof propertyData.sqft === 'number' ? propertyData.sqft : 0,
        price: typeof propertyData.rent === 'number' ? propertyData.rent : 0,
        propertyType: propertyData.propertyName || undefined,
        url: isUrl ? input : undefined
      };
      
      // Add the property to the list
      setProperties(prev => [...prev, extractedProperty]);
      
      // Clear the input field after successful addition
      setPropertyInput("");
      
      toast({
        title: "Property Added",
        description: `Successfully added ${propertyData.address}`,
      });
    } catch (error) {
      console.error("Error processing property input:", error);
      toast({
        title: "Addition Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to extract property details. Please try another input or check your formatting.",
        variant: "destructive",
      });
    } finally {
      setProcessingInput(false);
    }
  };

  const handleRemoveProperty = (index: number) => {
    const newProperties = [...properties];
    newProperties.splice(index, 1);
    setProperties(newProperties);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate property data before submission
    if (properties.length < 2) {
      toast({
        title: "More Properties Needed",
        description: "Please add at least 2 properties to compare",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit(properties);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-2">
        Enter property addresses or listing URLs from sites like Zillow, Apartments.com, Realtor.com
      </div>
      
      <div className="space-y-4">
        <form className="flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          handlePropertyInput();
        }}>
          <Input
            value={propertyInput}
            onChange={(e) => setPropertyInput(e.target.value)}
            placeholder="Enter address or paste listing URL..."
            className="flex-1"
            disabled={processingInput || isLoading}
          />
          <Button 
            type="submit"
            disabled={processingInput || isLoading || !propertyInput.trim()}
          >
            {processingInput ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Add
              </>
            )}
          </Button>
        </form>
        
        {/* Display added properties */}
        {properties.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Added Properties</h3>
            <div className="space-y-2">
              {properties.map((property, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-background border rounded-md">
                  <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{property.address}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {property.bedrooms > 0 && (
                        <Badge variant="outline" className="text-xs">{property.bedrooms} bed</Badge>
                      )}
                      {property.bathrooms > 0 && (
                        <Badge variant="outline" className="text-xs">{property.bathrooms} bath</Badge>
                      )}
                      {property.squareFootage > 0 && (
                        <Badge variant="outline" className="text-xs">{property.squareFootage} sqft</Badge>
                      )}
                      {property.price > 0 && (
                        <Badge variant="outline" className="text-xs">${property.price}/mo</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveProperty(index)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          {properties.length}/4 properties added
        </div>
      </div>

      <Button 
        type="button" 
        className="w-full mt-4" 
        onClick={handleSubmit}
        disabled={isLoading || properties.length < 2}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Properties
          </>
        ) : (
          "Compare Properties"
        )}
      </Button>
    </div>
  );
}
