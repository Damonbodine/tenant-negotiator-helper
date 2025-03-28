
import React from "react";

interface ScenarioDetails {
  title: string;
  description: string;
  marketRate: string;
  askingPrice: string;
  propertyAge: string;
  amenities: string[];
  occupancyRate: string;
  tips: string[];
}

interface PracticeScenarioProps {
  scenario: string;
}

export const PracticeScenario = ({ scenario }: PracticeScenarioProps) => {
  const scenarios: Record<string, ScenarioDetails> = {
    standard: {
      title: "Standard Apartment",
      description: "A 1-bedroom apartment in a mid-rise building located in an urban area with moderate demand.",
      marketRate: "$1,500 - $1,650",
      askingPrice: "$1,700",
      propertyAge: "15 years",
      amenities: ["In-unit washer/dryer", "Fitness center", "Package service"],
      occupancyRate: "85%",
      tips: [
        "Research shows similar units in the area rent for $1,550 on average",
        "The apartment has been vacant for 45 days",
        "Offer to sign an 18-month lease instead of 12 months",
        "Ask about waiving amenity or parking fees"
      ]
    },
    luxury: {
      title: "Luxury Condo",
      description: "A high-end 2-bedroom condo in a new building with premium finishes and full amenity package.",
      marketRate: "$2,800 - $3,200",
      askingPrice: "$3,400",
      propertyAge: "2 years",
      amenities: ["Concierge", "Rooftop pool", "Smart home features", "Private balcony", "EV charging"],
      occupancyRate: "92%",
      tips: [
        "This is a high-demand property with limited options to negotiate price",
        "Focus on getting concessions like free parking or storage",
        "Ask about move-in specials or reduced security deposit",
        "Consider requesting upgrades like smart appliances"
      ]
    },
    house: {
      title: "Single Family Home",
      description: "A 3-bedroom, 2-bathroom single family home in a suburban neighborhood with a yard and garage.",
      marketRate: "$2,200 - $2,400",
      askingPrice: "$2,500",
      propertyAge: "25 years",
      amenities: ["Fenced yard", "2-car garage", "Finished basement", "Fireplace"],
      occupancyRate: "Low inventory in area",
      tips: [
        "The home needs some minor repairs and updates",
        "Offer to handle lawn care and minor maintenance yourself",
        "Previous tenants stayed for 4+ years",
        "Emphasize your stability and reliability as a tenant"
      ]
    }
  };
  
  const currentScenario = scenarios[scenario] || scenarios.standard;
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{currentScenario.title}</h3>
        <p className="text-muted-foreground text-sm">{currentScenario.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="font-medium">Market Rate:</p>
          <p className="text-muted-foreground">{currentScenario.marketRate}</p>
        </div>
        <div>
          <p className="font-medium">Asking Price:</p>
          <p className="text-muted-foreground">{currentScenario.askingPrice}</p>
        </div>
        <div>
          <p className="font-medium">Property Age:</p>
          <p className="text-muted-foreground">{currentScenario.propertyAge}</p>
        </div>
        <div>
          <p className="font-medium">Occupancy:</p>
          <p className="text-muted-foreground">{currentScenario.occupancyRate}</p>
        </div>
      </div>
      
      <div className="text-sm">
        <p className="font-medium">Amenities:</p>
        <ul className="list-disc pl-5 text-muted-foreground">
          {currentScenario.amenities.map((amenity, index) => (
            <li key={index}>{amenity}</li>
          ))}
        </ul>
      </div>
      
      <div className="text-sm">
        <p className="font-medium">Negotiation Tips:</p>
        <ul className="list-disc pl-5 text-muted-foreground">
          {currentScenario.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
