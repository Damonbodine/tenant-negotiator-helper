
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeaseResponsibilitiesSectionProps {
  responsibilities?: LeaseAnalysisResult['responsibilities'];
}

export function LeaseResponsibilitiesSection({ responsibilities }: LeaseResponsibilitiesSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Responsibilities</CardTitle>
      </CardHeader>
      <CardContent>
        {responsibilities ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {responsibilities.tenant && responsibilities.tenant.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-cyan-400">Tenant Responsibilities</h4>
                <div className="bg-cyan-950/40 p-4 rounded-md">
                  <ul className="list-disc list-inside space-y-1 text-sm text-cyan-100/80">
                    {responsibilities.tenant.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {responsibilities.landlord && responsibilities.landlord.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-cyan-400">Landlord Responsibilities</h4>
                <div className="bg-cyan-950/40 p-4 rounded-md">
                  <ul className="list-disc list-inside space-y-1 text-sm text-cyan-100/80">
                    {responsibilities.landlord.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-cyan-100/80">No responsibility details were found in the lease document.</p>
        )}
      </CardContent>
    </>
  );
}
