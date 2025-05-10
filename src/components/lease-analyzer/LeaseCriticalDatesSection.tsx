
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle } from "lucide-react";

interface CriticalDate {
  label: string;
  date: string;
}

interface LeaseCriticalDatesSectionProps {
  criticalDates: CriticalDate[];
}

export function LeaseCriticalDatesSection({ criticalDates }: LeaseCriticalDatesSectionProps) {
  // Try to parse date strings to determine if they're actual dates or just descriptions
  const isActualDate = (dateString: string) => {
    if (!dateString) return false;
    
    // Check common date formats
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return true; // YYYY-MM-DD
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) return true; // MM/DD/YYYY
    
    // Try parsing with Date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };
  
  // Format dates for display if they are actual dates
  const formatDateIfPossible = (dateString: string) => {
    if (!dateString) return "Not specified";
    
    if (isActualDate(dateString)) {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return dateString; // Return the original string if parsing fails
      }
    }
    
    return dateString; // Return as is if not a date
  };

  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Calendar className="h-5 w-5" /> Critical Dates
          </CardTitle>
          <CardDescription>Important deadlines and dates to remember</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criticalDates && criticalDates.length > 0 ? (
              criticalDates.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-cyan-400/20 pb-3 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-cyan-400">{item.label}</h4>
                      <p className="text-cyan-100/90">{formatDateIfPossible(item.date)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <p className="text-cyan-100/90">No critical dates specified in the lease</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-cyan-950/40 rounded-lg">
            <h4 className="font-medium text-cyan-400 flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" /> Calendar Integration Tip
            </h4>
            <p className="text-sm text-cyan-100/90">
              Add these important dates to your calendar with reminders set several days in advance. 
              This will help you avoid missing critical deadlines that could affect your lease renewal, 
              security deposit, or other important aspects of your tenancy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
