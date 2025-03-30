
import { Home, MapPin, BedDouble, Bath, DollarSign, ActivitySquare } from "lucide-react";
import { PropertyDetails } from "./types";

interface PropertyDetailsSectionProps {
  property: PropertyDetails;
  formatPrice: (price: number | null) => string;
  formatSqFt: (sqft: number | null) => string;
}

export function PropertyDetailsSection({ property, formatPrice, formatSqFt }: PropertyDetailsSectionProps) {
  return (
    <div>
      <h3 className="font-medium text-lg mb-3">Subject Property</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Type:</span>
            <span className="text-sm">{property.propertyType || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Address:</span>
            <span className="text-sm truncate">{property.address || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Bedrooms:</span>
            <span className="text-sm">{property.bedrooms || "N/A"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Bathrooms:</span>
            <span className="text-sm">{property.bathrooms || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Price:</span>
            <span className="text-sm">{formatPrice(property.price)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">Size:</span>
            <span className="text-sm">{formatSqFt(property.squareFootage)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Zip Code:</span>
            <span className="text-sm">{property.zipCode || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
