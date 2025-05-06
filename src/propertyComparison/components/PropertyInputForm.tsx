import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Plus, Trash, Link as LinkIcon } from "lucide-react";
import { PropertyDetails } from "@/shared/types/comparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeListingWithSupabase } from "@/api/listing-analyzer";
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
  const [urlInputs, setUrlInputs] = useState<string[]>(["", "", "", ""]);
  const [extractingIndices, setExtractingIndices] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("manual");

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
    }
  };

  const handlePropertyChange = (index: number, field: keyof PropertyDetails, value: string | number) => {
    const newProperties = [...properties];
    newProperties[index] = {
      ...newProperties[index],
      [field]: field === "address" || field === "zipCode" || field === "propertyType" ? value : Number(value)
    };
    setProperties(newProperties);
  };

  const handleUrlInputChange = (index: number, value: string) => {
    const newUrlInputs = [...urlInputs];
    newUrlInputs[index] = value;
    setUrlInputs(newUrlInputs);
  };

  const handleUrlExtract = async (index: number) => {
    const url = urlInputs[index];
    
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a property listing URL",
        variant: "destructive",
      });
      return;
    }

    // Add index to extracting state
    setExtractingIndices(prev => [...prev, index]);
    
    try {
      // Extract property details from URL
      const data = await analyzeListingWithSupabase(url);
      
      if (!data.address) {
        throw new Error("Could not extract address from this listing");
      }

      // Map the extracted data to PropertyDetails format
      const extractedProperty: PropertyDetails = {
        address: data.address || "",
        zipCode: data.zipcode || "",
        bedrooms: typeof data.beds === 'number' ? data.beds : 0,
        bathrooms: typeof data.baths === 'number' ? data.baths : 0,
        squareFootage: typeof data.sqft === 'number' ? data.sqft : 0,
        price: typeof data.rent === 'number' ? data.rent : 0,
        propertyType: data.propertyName || undefined,
        url: url
      };
      
      // Add this property to the list, replacing property at the same index
      const newProperties = [...properties];
      
      // If we already have 4 properties, replace the one at this index
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
        setExtractingIndices(prev => prev.filter(i => i !== index));
        return;
      }
      
      setProperties(newProperties);
      
      // Clear the URL input field
      const newUrlInputs = [...urlInputs];
      newUrlInputs[index] = "";
      setUrlInputs(newUrlInputs);
      
      toast({
        title: "Property Added",
        description: `Successfully extracted details for ${data.address}`,
      });
    } catch (error) {
      console.error("Error extracting property data:", error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to extract property details. Please try another URL or enter details manually.",
        variant: "destructive",
      });
    } finally {
      // Remove index from extracting state
      setExtractingIndices(prev => prev.filter(i => i !== index));
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

  const clearUrl = (index: number) => {
    const newUrlInputs = [...urlInputs];
    newUrlInputs[index] = "";
    setUrlInputs(newUrlInputs);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="url">Add by URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4 pt-4">
          <div className="text-sm text-muted-foreground mb-2">
            Enter property listing URLs from sites like Zillow, Apartments.com, Realtor.com, etc.
          </div>
          <div className="space-y-4">
            {urlInputs.map((urlInput, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-shrink-0 text-xs font-medium text-muted-foreground w-8">
                  #{index + 1}
                </div>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => handleUrlInputChange(index, e.target.value)}
                    placeholder="https://www.apartments.com/property/..."
                    className="flex-1"
                    disabled={extractingIndices.includes(index)}
                  />
                  <Button 
                    type="button" 
                    onClick={() => clearUrl(index)} 
                    variant="outline" 
                    size="icon"
                    disabled={!urlInput || extractingIndices.includes(index)}
                    className="px-2"
                  >
                    <Trash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => handleUrlExtract(index)}
                    disabled={extractingIndices.includes(index) || !urlInput}
                  >
                    {extractingIndices.includes(index) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" /> Extract
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
            <Button 
              type="button" 
              onClick={() => setActiveTab("manual")}
              variant="outline"
            >
              Edit Properties Manually
            </Button>
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
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {properties.map((property, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Property {index + 1}</h3>
                    {properties.length > 2 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveProperty(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <Input
                        value={property.address}
                        onChange={(e) => handlePropertyChange(index, "address", e.target.value)}
                        placeholder="123 Main St, City, State"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <Input
                        value={property.zipCode}
                        onChange={(e) => handlePropertyChange(index, "zipCode", e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <Input
                        type="number"
                        min="0"
                        value={property.bedrooms || ""}
                        onChange={(e) => handlePropertyChange(index, "bedrooms", e.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={property.bathrooms || ""}
                        onChange={(e) => handlePropertyChange(index, "bathrooms", e.target.value)}
                        placeholder="1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
                      <Input
                        type="number"
                        min="0"
                        value={property.squareFootage || ""}
                        onChange={(e) => handlePropertyChange(index, "squareFootage", e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                      <Input
                        type="number"
                        min="0"
                        value={property.price || ""}
                        onChange={(e) => handlePropertyChange(index, "price", e.target.value)}
                        placeholder="1500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {properties.length < 4 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddProperty} 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Property (Up to 4)
              </Button>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || properties.some(p => !p.address)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Properties
                </>
              ) : (
                "Compare Properties"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
