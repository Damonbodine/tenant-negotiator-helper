
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ScenarioSelectorProps {
  selectedScenario: string;
  onScenarioChange: (scenario: string) => void;
}

export function ScenarioSelector({ selectedScenario, onScenarioChange }: ScenarioSelectorProps) {
  const [randomScenario, setRandomScenario] = useState<{
    title: string;
    description: string;
    marketRate: string;
    askingPrice: string;
    propertyAge: string;
    amenities: string[];
    occupancyRate: string;
    tips: string[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate a random scenario
  const generateRandomScenario = () => {
    setIsLoading(true);
    
    // Property types
    const propertyTypes = ["Apartment", "Condo", "Studio", "Loft", "Townhouse", "Duplex"];
    
    // Locations
    const locations = ["Downtown", "Uptown", "Midtown", "West Side", "East Side", "North End", "South District"];
    
    // Cities
    const cities = ["Austin", "Denver", "Chicago", "Seattle", "Portland", "Atlanta", "Nashville"];
    
    // Amenities pool
    const amenitiesPool = [
      "In-unit washer/dryer", "Fitness center", "Package service", "Swimming pool", 
      "Rooftop terrace", "Dog park", "Bike storage", "EV charging", "Smart home features",
      "Concierge", "Co-working space", "Game room", "Hot tub", "Outdoor grilling area",
      "Private balcony", "Guest parking", "On-site maintenance", "Storage units"
    ];
    
    // Tips pool
    const tipsPool = [
      "Research shows similar units nearby rent for less",
      "The unit has been vacant for over a month",
      "Offer to sign a longer lease for a discount",
      "Ask about waiving amenity or parking fees",
      "Highlight your excellent rental history",
      "Mention you're considering several properties",
      "Point out minor maintenance issues that need addressing",
      "Offer to handle some maintenance yourself",
      "Request a month of free parking or storage",
      "Ask about move-in specials being offered",
      "Suggest a slightly lower rent with automatic payments",
      "Inquire about rent discounts for paying several months upfront",
      "Reference recent rentals in the building at lower rates",
      "Mention market trends showing rental prices stabilizing",
      "Ask about flexibility on the security deposit amount"
    ];
    
    // Generate random property details
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const bedrooms = Math.floor(Math.random() * 3) + 1;
    const bathrooms = Math.floor(Math.random() * 2) + 1;
    
    // Generate a random base price between $1000-$3000
    const basePrice = Math.floor(Math.random() * 2000) + 1000;
    
    // Format market rate as a range around the base price
    const marketRateLow = basePrice - Math.floor(Math.random() * 200);
    const marketRateHigh = basePrice + Math.floor(Math.random() * 200);
    
    // Asking price is slightly above market rate
    const askingPrice = basePrice + Math.floor(Math.random() * 300) + 100;
    
    // Property age between 1-40 years
    const propertyAge = Math.floor(Math.random() * 40) + 1;
    
    // Select 3-5 random amenities
    const amenitiesCount = Math.floor(Math.random() * 3) + 3;
    const shuffledAmenities = [...amenitiesPool].sort(() => 0.5 - Math.random());
    const amenities = shuffledAmenities.slice(0, amenitiesCount);
    
    // Select 3-5 random tips
    const tipsCount = Math.floor(Math.random() * 3) + 3;
    const shuffledTips = [...tipsPool].sort(() => 0.5 - Math.random());
    const tips = shuffledTips.slice(0, tipsCount);
    
    // Randomly determine occupancy rate
    const occupancyPercent = Math.floor(Math.random() * 30) + 70;
    const occupancyRate = `${occupancyPercent}%`;
    
    // Create the random scenario
    const newRandomScenario = {
      title: `${bedrooms}BR/${bathrooms}BA ${propertyType}`,
      description: `A ${bedrooms}-bedroom, ${bathrooms}-bathroom ${propertyType.toLowerCase()} in ${location} ${city} with modern finishes and convenient access to amenities.`,
      marketRate: `$${marketRateLow} - $${marketRateHigh}`,
      askingPrice: `$${askingPrice}`,
      propertyAge: `${propertyAge} years`,
      amenities,
      occupancyRate,
      tips
    };
    
    setRandomScenario(newRandomScenario);
    setIsLoading(false);
  };
  
  // Generate a random scenario on first render
  useEffect(() => {
    generateRandomScenario();
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{randomScenario?.title || "Loading..."}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateRandomScenario}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Generate New Scenario
        </Button>
      </div>
      
      {randomScenario ? (
        <>
          <p className="text-muted-foreground text-sm">{randomScenario.description}</p>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium">Market Rate:</p>
              <p className="text-muted-foreground">{randomScenario.marketRate}</p>
            </div>
            <div>
              <p className="font-medium">Asking Price:</p>
              <p className="text-muted-foreground">{randomScenario.askingPrice}</p>
            </div>
            <div>
              <p className="font-medium">Property Age:</p>
              <p className="text-muted-foreground">{randomScenario.propertyAge}</p>
            </div>
            <div>
              <p className="font-medium">Occupancy:</p>
              <p className="text-muted-foreground">{randomScenario.occupancyRate}</p>
            </div>
          </div>
          
          <div className="text-sm">
            <p className="font-medium">Amenities:</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {randomScenario.amenities.map((amenity, index) => (
                <li key={index}>{amenity}</li>
              ))}
            </ul>
          </div>
          
          <div className="text-sm">
            <p className="font-medium">Negotiation Tips:</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {randomScenario.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>Generating random scenario...</p>
      )}
    </div>
  );
}
