
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle } from "lucide-react";

interface EarlyTermination {
  allowed: boolean;
  fee: string;
}

interface Term {
  start: string;
  end: string;
  durationMonths: number;
  renewalType: string;
  renewalNoticeDays: number;
  earlyTermination: EarlyTermination;
}

interface LeaseTermSectionProps {
  term: Term;
}

export function LeaseTermSection({ term }: LeaseTermSectionProps) {
  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Not specified";
      
      // Check if this is a valid date string
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString; // Return as is if not in YYYY-MM-DD format
      }
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString; // Return the original string if parsing fails
    }
  };

  const startDate = formatDate(term.start);
  const endDate = formatDate(term.end);
  
  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Calendar className="h-5 w-5" /> Lease Term
          </CardTitle>
          <CardDescription>Duration and key dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Start Date</h4>
                <p className="text-xl font-bold text-cyan-400">{startDate}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">End Date</h4>
                <p className="text-xl font-bold text-cyan-400">{endDate}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Term Length</h4>
                <p className="text-xl font-bold text-cyan-400">{term.durationMonths} months</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Renewal Type</h4>
                <p className="text-xl font-bold text-cyan-400 capitalize">{term.renewalType}</p>
                <p className="text-sm text-cyan-400/60">
                  {term.renewalType === 'automatic' 
                    ? 'Lease automatically renews unless notice is given' 
                    : 'Requires action to renew'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Notice Required</h4>
                <p className="text-xl font-bold text-cyan-400">{term.renewalNoticeDays} days</p>
                <p className="text-sm text-cyan-400/60">Before lease end date</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <AlertCircle className="h-5 w-5" /> Early Termination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-cyan-950/40">
              <h4 className="font-medium text-cyan-400 mb-1">Early Termination Policy</h4>
              <p className="text-cyan-100/90">
                {term.earlyTermination.allowed 
                  ? `Allowed with ${term.earlyTermination.fee}`
                  : "Not allowed by this lease agreement"}
              </p>
              
              {term.earlyTermination.allowed && (
                <div className="mt-3 bg-cyan-800/20 border border-cyan-700/20 rounded-lg p-3">
                  <p className="text-sm text-cyan-100/80">
                    <strong>Note:</strong> Early termination fees may be negotiable in certain circumstances,
                    such as job relocation or health issues. Check your local tenant laws.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-blue-950/30 border border-blue-400/20 rounded-lg flex items-start gap-2">
              <Clock className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300/90">
                Set a calendar reminder for {term.renewalNoticeDays} days before your lease ends ({formatDate(term.end)}) to
                decide whether you want to renew, negotiate, or give notice to move out.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
