
import { useState } from "react";
import { PropertyInputForm } from "./PropertyInputForm";
import { ComparisonResults } from "./ComparisonResults";
import { PropertyComparisonResponse, PropertyDetails } from "@/shared/types/comparison";
import { compareProperties } from "../services/comparisonService";
import { toast } from "@/shared/hooks/use-toast";
import { Link } from "react-router-dom";

export default function PropertyComparison() {
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<PropertyComparisonResponse | null>(null);

  const handleSubmit = async (properties: PropertyDetails[]) => {
    setIsLoading(true);
    try {
      const results = await compareProperties(properties);
      setComparisonResults(results);
    } catch (error) {
      console.error("Error comparing properties:", error);
      toast({
        title: "Error comparing properties",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container py-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Property Comparison</h2>
          <Link to="/" className="px-4 py-2 rounded-lg text-muted-foreground border-muted-foreground border-[1px] hover:opacity-70 transition-opacity">
            Back to home
          </Link>
        </div>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Advanced Property Comparison</h1>
        <p className="text-muted-foreground">
          Compare up to 4 rental properties side-by-side with detailed analysis and cost breakdowns.
          Enter the property details below to get started.
        </p>
      </div>

      {!comparisonResults ? (
        <PropertyInputForm onSubmit={handleSubmit} isLoading={isLoading} />
      ) : (
        <div className="space-y-6">
          <ComparisonResults comparison={comparisonResults} isLoading={isLoading} />
          <button
            onClick={() => setComparisonResults(null)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Compare Different Properties
          </button>
        </div>
      )}
    </div>
    </div>
    </main>
  );
}
