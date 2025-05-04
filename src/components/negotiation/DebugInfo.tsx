
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bug, AlertTriangle } from "lucide-react";
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
  if (!showDebugInfo) return null;
  return <>
      {httpStatus && <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-4">
        <Bug className="h-4 w-4" />
        <AlertTitle>Debug Information</AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            <p>HTTP Status: {httpStatus}</p>
            {requestStartTime && <p>Request Start: {requestStartTime}</p>}
            {requestEndTime && <p>Request End: {requestEndTime}</p>}
            {Object.keys(additionalInfo).length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Additional Info:</p>
                <pre className="text-xs bg-blue-100 p-2 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(additionalInfo, null, 2)}
                </pre>
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
