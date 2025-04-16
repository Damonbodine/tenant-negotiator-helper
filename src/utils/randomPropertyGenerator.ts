
import { PropertyDetails } from "@/components/negotiation/types";

const PROPERTY_TYPES = ["Apartment", "Condo", "Studio", "Loft"];
const NEIGHBORHOODS = ["Downtown", "Uptown", "Midtown", "West Side", "East Side"];
const CITIES = ["Austin", "Denver", "Chicago", "Seattle", "Portland", "Atlanta"];
const ZIP_CODES = ["78701", "80202", "60601", "98101", "97201", "30303"];

export const generateRandomProperty = (): PropertyDetails => {
  const propertyType = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
  const neighborhood = NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)];
  const cityIndex = Math.floor(Math.random() * CITIES.length);
  const city = CITIES[cityIndex];
  const zipCode = ZIP_CODES[cityIndex];
  
  const bedrooms = Math.floor(Math.random() * 3) + 1;
  const bathrooms = Math.floor(Math.random() * 2) + 1;
  const squareFootage = (Math.floor(Math.random() * 800) + 600) * bedrooms;
  const pricePerSqFt = Math.floor(Math.random() * 2) + 2;
  const price = Math.floor(squareFootage * pricePerSqFt);

  return {
    address: `${Math.floor(Math.random() * 999) + 100} ${neighborhood} St`,
    zipCode,
    bedrooms,
    bathrooms,
    price,
    propertyType,
    squareFootage,
    url: `https://example.com/listing/${Math.random().toString(36).substring(7)}`
  };
};
