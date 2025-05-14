
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface LeaseRedFlagsSectionProps {
  redFlags?: LeaseAnalysisResult['redFlags'];
}

export function LeaseRedFlagsSection({ redFlags }: LeaseRedFlagsSectionProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-950/30 border-red-600/50 text-red-200';
      case 'medium':
        return 'bg-orange-950/30 border-orange-600/50 text-orange-200';
      case 'low':
        return 'bg-yellow-950/30 border-yellow-600/50 text-yellow-200';
      default:
        return 'bg-cyan-950/30 border-cyan-600/50 text-cyan-200';
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl font-medium text-cyan-400">Potential Red Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {redFlags && redFlags.length > 0 ? (
          <div className="space-y-4">
            {redFlags.map((flag, index) => (
              <Alert key={index} className={`${getSeverityColor(flag.severity)} border`}>
                <Info className="h-4 w-4 mr-2" />
                <AlertTitle className="text-sm font-medium flex items-center">
                  <span className="capitalize">{flag.severity}</span> Severity Issue
                </AlertTitle>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  {flag.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </Alert>
            ))}
            
            <div className="bg-cyan-950/30 p-4 rounded-md border border-cyan-800/30 mt-4">
              <p className="text-xs text-cyan-100/70">
                <strong>Note:</strong> These red flags are based on AI analysis and should not be considered legal advice. 
                Consult with a legal professional for specific concerns about your lease terms.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-cyan-100/80">No significant red flags were detected in the lease document.</p>
            
            <div className="bg-cyan-950/30 p-4 rounded-md border border-cyan-800/30">
              <p className="text-xs text-cyan-100/70">
                <strong>Note:</strong> While no red flags were detected, we recommend carefully reviewing your lease and 
                consulting with a legal professional if you have specific concerns about your lease terms.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
}
