
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetails, AnalysisResult } from "./types";
import { marketService } from "@/utils/marketService";

export function useApartmentAnalysis() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawErrorResponse, setRawErrorResponse] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [requestStartTime, setRequestStartTime] = useState<string | null>(null);
  const [requestEndTime, setRequestEndTime] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatSqFt = (sqft: number | null) => {
    if (sqft === null) return "N/A";
    return new Intl.NumberFormat('en-US').format(sqft) + " sqft";
  };

  const handleAnalyze = async (propertyDetails: PropertyDetails) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAnalysis(null);
    setRawErrorResponse(null);
    setHttpStatus(null);
    setApiError(null);
    setRequestStartTime(new Date().toISOString());
    setRequestEndTime(null);

    try {
      console.log("Sending request to rental-analysis function with details:", propertyDetails);
      console.log("Request started at:", requestStartTime);
      
      const result = await marketService.analyzeProperty(propertyDetails);
      
      console.log("Analysis result from rental-analysis function:", result);
      
      if (!result) {
        console.error("No data returned from function");
        setRawErrorResponse("No data returned from function call");
        throw new Error("No data returned from analysis service");
      }
      
      setAnalysis(result);
        
      // Only show toast if we actually got data
      if (result.comparables && result.comparables.length > 0) {
        toast({
          title: "Analysis Complete",
          description: `Found ${result.comparables.length} comparable properties`,
          variant: "default"
        });
      } else {
        setApiError("No comparable properties found. Please try a different listing.");
        toast({
          title: "No Comparables Found",
          description: "We couldn't find comparable properties for this listing",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error analyzing apartment:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred while analyzing the apartment"
      );
      toast({
        title: "Analysis Error",
        description: "We encountered a problem analyzing this listing. See details below.",
        variant: "destructive"
      });
    } finally {
      const endTime = new Date().toISOString();
      setRequestEndTime(endTime);
      console.log("Request completed at:", endTime);
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    analysis,
    errorMessage,
    rawErrorResponse,
    httpStatus,
    requestStartTime,
    requestEndTime,
    apiError,
    handleAnalyze,
    formatPrice,
    formatSqFt,
    resetAnalysis: () => setAnalysis(null)
  };
}
