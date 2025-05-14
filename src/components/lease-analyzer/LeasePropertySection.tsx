
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeasePropertySectionProps {
  propertyDetails?: LeaseAnalysisResult['propertyDetails'];
}

export function LeasePropertySection({ propertyDetails }: LeasePropertySectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Property Details</CardTitle>
      </CardHeader>
      <CardContent>
        {propertyDetails ? (
          <div className="space-y-4">
            {propertyDetails.address && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Address:</span>
                  {propertyDetails.address}
                  {propertyDetails.unitNumber && `, Unit ${propertyDetails.unitNumber}`}
                </p>
              </div>
            )}
            
            {propertyDetails.includedAmenities && propertyDetails.includedAmenities.length > 0 && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Included Amenities:</span>
                  <ul className="list-disc list-inside mt-1">
                    {propertyDetails.includedAmenities.map((amenity, index) => (
                      <li key={index}>{amenity}</li>
                    ))}
                  </ul>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-cyan-100/80">No property details were found in the lease document.</p>
        )}
      </CardContent>
    </>
  );
}
