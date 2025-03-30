
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bug, AlertTriangle } from "lucide-react";

interface DebugInfoProps {
  showDebugInfo: boolean;
  httpStatus: number | null;
  requestStartTime: string | null;
  requestEndTime: string | null;
  rawErrorResponse: string | null;
}

export function DebugInfo({ showDebugInfo, httpStatus, requestStartTime, requestEndTime, rawErrorResponse }: DebugInfoProps) {
  if (!showDebugInfo) return null;

  return (
    <>
      <Alert className="bg-gray-50 border-gray-200 text-gray-800 mb-4">
        <AlertTitle className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Technical Debugging Information
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2 text-xs">
            <div><strong>HTTP Status:</strong> {httpStatus || "N/A"}</div>
            {requestStartTime && (
              <div><strong>Request Start:</strong> {requestStartTime}</div>
            )}
            {requestEndTime && (
              <div><strong>Request End:</strong> {requestEndTime}</div>
            )}
            {requestStartTime && requestEndTime && (
              <div><strong>Duration:</strong> {
                new Date(requestEndTime).getTime() - new Date(requestStartTime).getTime()
              } ms</div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {rawErrorResponse && (
        <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Details (Debug)</AlertTitle>
          <AlertDescription>
            <div className="mt-2 p-2 bg-red-100 rounded-md overflow-auto max-h-60">
              <pre className="text-xs whitespace-pre-wrap">{rawErrorResponse}</pre>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
