
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeasePartiesSectionProps {
  parties?: LeaseAnalysisResult['parties'];
}

export function LeasePartiesSection({ parties }: LeasePartiesSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Lease Parties</CardTitle>
      </CardHeader>
      <CardContent>
        {parties ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parties.landlord && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Landlord/Owner:</span>
                  {parties.landlord}
                </p>
              </div>
            )}
            
            {parties.propertyManager && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Property Manager:</span>
                  {parties.propertyManager}
                </p>
              </div>
            )}
            
            {parties.tenant && parties.tenant.length > 0 && (
              <div className="bg-cyan-950/40 p-4 rounded-md md:col-span-2">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Tenant(s):</span>
                  <ul className="list-disc list-inside mt-1">
                    {parties.tenant.map((tenant, index) => (
                      <li key={index}>{tenant}</li>
                    ))}
                  </ul>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-cyan-100/80">No party information was found in the lease document.</p>
        )}
      </CardContent>
    </>
  );
}
