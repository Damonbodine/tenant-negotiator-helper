
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeaseTermSectionProps {
  leaseTerms?: LeaseAnalysisResult['leaseTerms'];
}

export function LeaseTermSection({ leaseTerms }: LeaseTermSectionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Lease Terms</CardTitle>
      </CardHeader>
      <CardContent>
        {leaseTerms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaseTerms.startDate && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Start Date:</span>
                  {leaseTerms.startDate}
                </p>
              </div>
            )}
            
            {leaseTerms.endDate && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">End Date:</span>
                  {leaseTerms.endDate}
                </p>
              </div>
            )}
            
            {leaseTerms.leaseTerm && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Lease Term:</span>
                  {leaseTerms.leaseTerm}
                </p>
              </div>
            )}
            
            {leaseTerms.noticeRequired && (
              <div className="bg-cyan-950/40 p-4 rounded-md">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Notice Required:</span>
                  {leaseTerms.noticeRequired}
                </p>
              </div>
            )}
            
            {leaseTerms.renewalTerms && (
              <div className="bg-cyan-950/40 p-4 rounded-md md:col-span-2">
                <p className="text-sm text-cyan-100/80">
                  <span className="font-medium block">Renewal Terms:</span>
                  {leaseTerms.renewalTerms}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-cyan-100/80">No lease term details were found in the document.</p>
        )}
      </CardContent>
    </>
  );
}
