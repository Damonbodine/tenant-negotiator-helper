
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PropertyDetails {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  propertyType: string;
  squareFootage: number;
  url?: string;
}

interface PropertyInputFormProps {
  onSubmit: (details: PropertyDetails) => void;
  isLoading: boolean;
}

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
  const [details, setDetails] = useState<PropertyDetails>({
    address: "",
    zipCode: "",
    bedrooms: 1,
    bathrooms: 1,
    price: 0,
    propertyType: "Apartment",
    squareFootage: 0,
    url: ""
  });

  const handleChange = (field: keyof PropertyDetails, value: string | number) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof PropertyDetails, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    if (!isNaN(numValue)) {
      handleChange(field, numValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea 
            id="address"
            placeholder="Enter the full property address"
            value={details.address}
            onChange={(e) => handleChange("address", e.target.value)}
            required
            className="min-h-[80px]"
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input 
              id="zipCode"
              placeholder="e.g. 10001"
              value={details.zipCode}
              onChange={(e) => handleChange("zipCode", e.target.value)}
              required
              maxLength={5}
              pattern="[0-9]{5}"
            />
          </div>
          
          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <Select 
              defaultValue={details.propertyType}
              onValueChange={(value) => handleChange("propertyType", value)}
            >
              <SelectTrigger id="propertyType">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input 
            id="bedrooms"
            type="number"
            min={0}
            step={1}
            value={details.bedrooms}
            onChange={(e) => handleNumberChange("bedrooms", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input 
            id="bathrooms"
            type="number"
            min={0}
            step={0.5}
            value={details.bathrooms}
            onChange={(e) => handleNumberChange("bathrooms", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Monthly Rent ($)</Label>
          <Input 
            id="price"
            type="number"
            min={0}
            value={details.price === 0 ? "" : details.price}
            onChange={(e) => handleNumberChange("price", e.target.value)}
            placeholder="e.g. 2000"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="squareFootage">Square Feet</Label>
          <Input 
            id="squareFootage"
            type="number"
            min={0}
            value={details.squareFootage === 0 ? "" : details.squareFootage}
            onChange={(e) => handleNumberChange("squareFootage", e.target.value)}
            placeholder="e.g. 800"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="url">Listing URL (Optional)</Label>
        <Input 
          id="url"
          placeholder="Link to the rental listing"
          value={details.url}
          onChange={(e) => handleChange("url", e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Searching..." : "Find Comparable Rentals"}
      </Button>
    </form>
  );
}
