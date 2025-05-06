
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Plus, Trash } from "lucide-react";
import { PropertyDetails } from "@/shared/types/comparison";

interface PropertyInputFormProps {
  onSubmit: (properties: PropertyDetails[]) => void;
  isLoading: boolean;
}

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
  const [properties, setProperties] = useState<PropertyDetails[]>([
    { address: "", zipCode: "", bedrooms: 0, bathrooms: 0, squareFootage: 0, price: 0 },
    { address: "", zipCode: "", bedrooms: 0, bathrooms: 0, squareFootage: 0, price: 0 }
  ]);

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
      [field]: field === "address" || field === "zipCode" ? value : Number(value)
    };
    setProperties(newProperties);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(properties);
  };

  return (
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
  );
}
