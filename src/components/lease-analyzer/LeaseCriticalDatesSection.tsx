
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeaseCriticalDatesSectionProps {
  criticalDates?: LeaseAnalysisResult['criticalDates'];
}

export function LeaseCriticalDatesSection({ criticalDates }: LeaseCriticalDatesSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Critical Dates</CardTitle>
      </CardHeader>
      <CardContent>
        {criticalDates ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalDates.moveIn && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Move-In Date:</span>
                  {criticalDates.moveIn}
                </p>
              </div>
            )}
            
            {criticalDates.moveOut && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Move-Out Date:</span>
                  {criticalDates.moveOut}
                </p>
              </div>
            )}
            
            {criticalDates.rentDueDate && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Rent Due Date:</span>
                  {criticalDates.rentDueDate}
                </p>
              </div>
            )}
            
            {criticalDates.lateFeeDate && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Late Fee Date:</span>
                  {criticalDates.lateFeeDate}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-cyan-100/80">No critical dates were found in the lease document.</p>
        )}
      </CardContent>
    </>
  );
}
