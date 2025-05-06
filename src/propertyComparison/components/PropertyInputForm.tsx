import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Plus, Trash, Link as LinkIcon } from "lucide-react";
import { PropertyDetails } from "@/shared/types/comparison";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
import { analyzeAddressWithSupabase } from "@/api/address-analyzer";
import { toast } from "@/shared/hooks/use-toast";

interface PropertyInputFormProps {
  onSubmit: (properties: PropertyDetails[]) => void;
  isLoading: boolean;
}

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
  const [properties, setProperties] = useState<PropertyDetails[]>([
    { address: "", zipCode: "", bedrooms: 0, bathrooms: 0, squareFootage: 0, price: 0 },
    { address: "", zipCode: "", bedrooms: 0, bathrooms: 0, squareFootage: 0, price: 0 }
  ]);
  const [propertyInputs, setPropertyInputs] = useState<string[]>(["", "", "", ""]);
  const [processingIndices, setProcessingIndices] = useState<number[]>([]);

  // URL regex pattern to detect if input is a URL
  const urlRegex = /(https?:\/\/(www\.)?(zillow|redfin|apartments|trulia|realtor|hotpads)\.com\/[^\s]+)/i;

  const handleAddProperty = () => {
    if (properties.length < 4) {
      setProperties([...properties, { address: "", zipCode: "", bedrooms: 0, bathrooms: 0, squareFootage: 0, price: 0 }]);
    }
  };

  const handleRemoveProperty = (index: number) => {
    if (properties.length > 2) {
      const newProperties = [...properties];
      newProperties.splice(index, 1);
      setProperties(newProperties);
      
      // Also clear the input field
      const newPropertyInputs = [...propertyInputs];
      newPropertyInputs[index] = "";
      setPropertyInputs(newPropertyInputs);
    }
  };

  const handlePropertyInputChange = (index: number, value: string) => {
    const newPropertyInputs = [...propertyInputs];
    newPropertyInputs[index] = value;
    setPropertyInputs(newPropertyInputs);
  };

  const handlePropertyInput = async (index: number) => {
    const input = propertyInputs[index].trim();
    
    if (!input) {
      toast({
        title: "Input Required",
        description: "Please enter a property URL or address",
        variant: "destructive",
      });
      return;
    }

    // Add index to processing state
    setProcessingIndices(prev => [...prev, index]);
    
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
        // Note: Address analyzer returns less structured data, so we'll extract what we can
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
      
      // Add this property to the list, replacing property at the same index
      const newProperties = [...properties];
      
      // If we already have properties, replace the one at this index
      if (index < newProperties.length) {
        newProperties[index] = extractedProperty;
      } 
      // Otherwise, add it if we're under the 4 property limit
      else if (newProperties.length < 4) {
        newProperties.push(extractedProperty);
      } else {
        toast({
          title: "Maximum Properties Reached",
          description: "You can compare up to 4 properties. Please remove one to add another.",
          variant: "destructive",
        });
        setProcessingIndices(prev => prev.filter(i => i !== index));
        return;
      }
      
      setProperties(newProperties);
      
      // Clear the input field after successful addition
      const newPropertyInputs = [...propertyInputs];
      newPropertyInputs[index] = "";
      setPropertyInputs(newPropertyInputs);
      
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
      // Remove index from processing state
      setProcessingIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate property data before submission
    const invalidProperties = properties.filter(p => !p.address);
    if (invalidProperties.length > 0) {
      toast({
        title: "Invalid Properties",
        description: "All properties must have at least an address",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit(properties);
  };

  const clearPropertyInput = (index: number) => {
    const newPropertyInputs = [...propertyInputs];
    newPropertyInputs[index] = "";
    setPropertyInputs(newPropertyInputs);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-2">
        Enter property addresses or listing URLs from sites like Zillow, Apartments.com, Realtor.com
      </div>
      
      <div className="space-y-4">
        {propertyInputs.map((propertyInput, index) => (
          <div key={index} className="flex gap-2 items-center">
            <div className="flex-shrink-0 text-xs font-medium text-muted-foreground w-8">
              #{index + 1}
            </div>
            <div className="flex flex-1 gap-2">
              <Input
                value={propertyInput}
                onChange={(e) => handlePropertyInputChange(index, e.target.value)}
                placeholder="Enter address or paste listing URL..."
                className="flex-1"
                disabled={processingIndices.includes(index)}
              />
              <Button 
                type="button" 
                onClick={() => clearPropertyInput(index)} 
                variant="outline" 
                size="icon"
                disabled={!propertyInput || processingIndices.includes(index)}
                className="px-2"
              >
                <Trash className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button 
                type="button"
                onClick={() => handlePropertyInput(index)}
                disabled={processingIndices.includes(index) || !propertyInput}
              >
                {processingIndices.includes(index) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          {properties.filter(p => p.address).length}/4 properties added
        </div>
        
        {properties.some(p => p.address) && (
          <div className="flex space-x-2">
            {properties.filter(p => p.address).map((property, index) => (
              <div key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                {property.address.split(',')[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button 
        type="button" 
        className="w-full mt-4" 
        onClick={handleSubmit}
        disabled={isLoading || properties.filter(p => p.address).length < 2}
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
