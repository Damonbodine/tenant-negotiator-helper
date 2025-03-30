
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import { PropertyInputForm } from "./PropertyInputForm";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { AnalysisResults } from "./AnalysisResults";
import { DebugInfo } from "./DebugInfo";
import { AlertMessages } from "./AlertMessages";
import { useApartmentAnalysis } from "./useApartmentAnalysis";

export function ApartmentAnalysis() {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const {
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
    resetAnalysis
  } = useApartmentAnalysis();

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  return (
    <Card className="h-full flex flex-col shadow-md border-blue-100 overflow-hidden">
      <CardContent className="p-6 flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Apartment Price Analysis</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDebugInfo}
            className="flex gap-1 items-center"
          >
            <Bug className="h-4 w-4" />
            {showDebugInfo ? "Hide Debug" : "Show Debug"}
          </Button>
        </div>
        
        {!analysis && !isLoading && (
          <PropertyInputForm onSubmit={handleAnalyze} isLoading={isLoading} />
        )}

        {isLoading && <LoadingState />}

        <DebugInfo 
          showDebugInfo={showDebugInfo} 
          httpStatus={httpStatus}
          requestStartTime={requestStartTime}
          requestEndTime={requestEndTime}
          rawErrorResponse={rawErrorResponse}
        />

        {!isLoading && (
          <AlertMessages 
            errorMessage={errorMessage}
            apiError={apiError}
          />
        )}

        {!isLoading && analysis && (
          <div className="mt-4">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">Analysis Results</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAnalysis}
              >
                New Analysis
              </Button>
            </div>
            <AnalysisResults 
              analysis={analysis} 
              formatPrice={formatPrice} 
              formatSqFt={formatSqFt} 
            />
          </div>
        )}

        {!isLoading && !analysis && !errorMessage && !rawErrorResponse && (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}
