
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bug, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DebugInfoProps {
  showDebugInfo: boolean;
  httpStatus: number | null;
  requestStartTime: string | null;
  requestEndTime: string | null;
  rawErrorResponse: string | null;
  additionalInfo?: Record<string, any>;
}

export function DebugInfo({
  showDebugInfo,
  httpStatus,
  requestStartTime,
  requestEndTime,
  rawErrorResponse,
  additionalInfo = {}
}: DebugInfoProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!showDebugInfo) return null;

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatAdditionalInfo = (info: Record<string, any>) => {
    return Object.entries(info).map(([key, value]) => {
      // Skip empty values
      if (value === null || value === undefined || value === "") return null;
      
      // Format value based on type
      let formattedValue = value;
      if (typeof value === 'object') {
        formattedValue = JSON.stringify(value, null, 2);
      }
      
      return (
        <div key={key} className="mb-2">
          <span className="font-medium text-blue-700">{key}:</span>
          {typeof formattedValue === 'string' && formattedValue.length > 100 ? (
            <pre className="text-xs bg-blue-100 p-2 mt-1 rounded-md overflow-auto max-h-40 whitespace-pre-wrap">
              {formattedValue}
            </pre>
          ) : (
            <span className="ml-2">{String(formattedValue)}</span>
          )}
        </div>
      );
    });
  };

  return <>
      {httpStatus && <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-4">
        <Bug className="h-4 w-4" />
        <AlertTitle className="flex justify-between items-center">
          <span>Debug Information</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-blue-700" 
            onClick={toggleDetails}
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            <p>HTTP Status: {httpStatus}</p>
            {requestStartTime && <p>Request Start: {requestStartTime}</p>}
            {requestEndTime && <p>Request End: {requestEndTime}</p>}
            {requestStartTime && requestEndTime && <p>
              Duration: {new Date(requestEndTime).getTime() - new Date(requestStartTime).getTime()}ms
            </p>}
            
            {showDetails && Object.keys(additionalInfo).length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Additional Info:</p>
                <div className="text-xs bg-blue-100 p-2 rounded-md overflow-auto max-h-60 mt-1">
                  {formatAdditionalInfo(additionalInfo)}
                </div>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>}

      {rawErrorResponse && <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Details (Debug)</AlertTitle>
          <AlertDescription>
            <div className="mt-2 p-2 bg-red-100 rounded-md overflow-auto max-h-60">
              <pre className="text-xs whitespace-pre-wrap">{rawErrorResponse}</pre>
            </div>
          </AlertDescription>
        </Alert>}
    </>;
}
