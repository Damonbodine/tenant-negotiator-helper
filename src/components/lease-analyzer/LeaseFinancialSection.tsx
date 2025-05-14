
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeaseFinancialSectionProps {
  financialTerms?: LeaseAnalysisResult['financialTerms'];
}

export function LeaseFinancialSection({ financialTerms }: LeaseFinancialSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Financial Terms</CardTitle>
      </CardHeader>
      <CardContent>
        {financialTerms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyan-950/40 p-4 rounded-md">
              <p className="text-sm text-cyan-100/80">
                <span className="font-medium block">Monthly Rent:</span>
                {financialTerms.monthlyRent ? `$${financialTerms.monthlyRent}` : "Not specified"}
              </p>
            </div>
            
            <div className="bg-cyan-950/40 p-4 rounded-md">
              <p className="text-sm text-cyan-100/80">
                <span className="font-medium block">Security Deposit:</span>
                {financialTerms.securityDeposit ? `$${financialTerms.securityDeposit}` : "Not specified"}
              </p>
            </div>
            
            {financialTerms.lateFees && (
              <div className="bg-cyan-950/40 p-4 rounded-md md:col-span-2">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Late Fees:</span>
                  {financialTerms.lateFees}
                </p>
              </div>
            )}
            
            {financialTerms.otherFees && financialTerms.otherFees.length > 0 && (
              <div className="bg-cyan-950/40 p-4 rounded-md md:col-span-2">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Other Fees:</span>
                  <ul className="list-disc list-inside mt-1">
                    {financialTerms.otherFees.map((fee, index) => (
                      <li key={index}>{fee}</li>
                    ))}
                  </ul>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-cyan-100/80">No financial terms were found in the lease document.</p>
        )}
      </CardContent>
    </>
  );
}
