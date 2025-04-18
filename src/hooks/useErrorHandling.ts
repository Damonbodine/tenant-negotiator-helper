
import { useState } from "react";
import { useToast } from "./use-toast";

interface ErrorState {
  message: string;
  details?: string;
}

export function useErrorHandling() {
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const resetError = () => setErrorState(null);

  const handleError = (error: any) => {
    console.error("Error in agent chat:", error);
    setErrorState({
      message: "Failed to get a response from the AI service. Please try again.",
      details: error?.toString()
    });
    
    toast({
      title: "Communication Error",
      description: "Failed to get response from the agent. Please try again.",
      variant: "destructive",
    });
  };

  return {
    errorState,
    setErrorState,
    resetError,
    handleError
  };
}
