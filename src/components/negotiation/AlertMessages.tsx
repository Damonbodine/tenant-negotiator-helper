
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";

interface AlertMessagesProps {
  errorMessage: string | null;
  apiError: string | null;
}

export function AlertMessages({ errorMessage, apiError }: AlertMessagesProps) {
  return (
    <>
      {errorMessage && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800 mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Analysis Note</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {apiError && (
        <Alert className="bg-red-50 border-red-200 text-red-800 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>
            {apiError}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
