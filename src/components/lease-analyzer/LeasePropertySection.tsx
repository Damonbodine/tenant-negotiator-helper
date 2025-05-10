
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, CheckCircle } from "lucide-react";

interface Property {
  address: string;
  type: string;
  amenities: string[];
  furnishings: string[];
}

interface LeasePropertySectionProps {
  property: Property;
}

export function LeasePropertySection({ property }: LeasePropertySectionProps) {
  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Home className="h-5 w-5" /> Property Details
          </CardTitle>
          <CardDescription>Information about the rental unit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-cyan-400/80">Full Address</h4>
              <p className="text-xl font-bold text-cyan-400 mt-1">{property.address}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-cyan-400/80">Property Type</h4>
              <p className="text-xl font-bold text-cyan-400 mt-1 capitalize">{property.type}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80 mb-3">Included Amenities</h4>
                {property.amenities && property.amenities.length > 0 ? (
                  <ul className="space-y-2">
                    {property.amenities.map((amenity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-1" />
                        <span className="text-cyan-100/90">{amenity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cyan-100/90">No amenities specified</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80 mb-3">Included Furnishings</h4>
                {property.furnishings && property.furnishings.length > 0 ? (
                  <ul className="space-y-2">
                    {property.furnishings.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-1" />
                        <span className="text-cyan-100/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cyan-100/90">Unfurnished</p>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-cyan-950/40 rounded-lg">
              <h4 className="font-medium text-cyan-400 mb-2">Documentation Tip</h4>
              <p className="text-sm text-cyan-100/90">
                When you move in, take detailed photos of the property condition, especially any existing damage.
                This will help protect your security deposit when you move out.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
