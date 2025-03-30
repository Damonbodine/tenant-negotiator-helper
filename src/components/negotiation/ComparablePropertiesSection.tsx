
import { Comparable } from "./types";

interface ComparablePropertiesSectionProps {
  comparables: Comparable[];
  formatPrice: (price: number | null) => string;
  formatSqFt: (sqft: number | null) => string;
}

export function ComparablePropertiesSection({ 
  comparables,
  formatPrice,
  formatSqFt
}: ComparablePropertiesSectionProps) {
  if (!comparables || comparables.length === 0) return null;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-lg">Comparable Properties</h3>
      </div>
      <div className="space-y-3">
        {comparables.map((comp, index) => (
          <div key={index} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between">
              <div className="truncate" style={{ maxWidth: '70%' }}>
                <div className="font-medium">{comp.address}</div>
                <div className="text-sm text-muted-foreground">
                  {comp.bedrooms} bed • {comp.bathrooms} bath • {formatSqFt(comp.squareFootage)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatPrice(comp.price)}</div>
                <div className="text-xs text-muted-foreground">
                  {comp.distance.toFixed(1)} miles away
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
