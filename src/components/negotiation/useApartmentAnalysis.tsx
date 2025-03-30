
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetails, AnalysisResult } from "./types";

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
      console.log("Sending request to apartment-analysis function with details:", propertyDetails);
      console.log("Request started at:", requestStartTime);
      
      const response = await supabase.functions.invoke('apartment-analysis', {
        body: { 
          propertyDetails
        }
      });
      
      console.log("Full response from apartment-analysis function:", JSON.stringify(response, null, 2));
      
      const { data, error } = response;
      
      if (error) {
        console.error("Supabase function error:", error);
        setHttpStatus(error.context?.status || 500);
        setRawErrorResponse(JSON.stringify(error, null, 2));
        throw new Error("Failed to connect to analysis service. Please try again later.");
      }

      if (!data) {
        console.error("No data returned from function");
        setRawErrorResponse("No data returned from function call");
        throw new Error("No data returned from analysis service");
      }
      
      if (data.success === false) {
        console.error("Function returned error:", data.error);
        setRawErrorResponse(JSON.stringify(data, null, 2));
        throw new Error(data.error || "Failed to analyze apartment");
      }

      if (data.message) {
        setErrorMessage(data.message);
      }

      if (data.technicalError) {
        console.warn("Technical error from function:", data.technicalError);
        setApiError(data.technicalError);
        setRawErrorResponse(JSON.stringify({
          technicalError: data.technicalError,
          apiStatus: data.apiStatus
        }, null, 2));
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
        
        // Only show toast if we actually got data
        if (data.analysis.comparables && data.analysis.comparables.length > 0) {
          toast({
            title: "Analysis Complete",
            description: `Found ${data.analysis.comparables.length} comparable properties`,
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
      } else {
        console.error("No analysis data in response:", data);
        setRawErrorResponse(JSON.stringify(data, null, 2));
        throw new Error("No analysis data returned");
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
