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