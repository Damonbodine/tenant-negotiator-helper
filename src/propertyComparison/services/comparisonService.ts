
import { supabase } from "@/integrations/supabase/client";
import { PropertyComparisonResponse, PropertyDetails } from "@/shared/types/comparison";
import { toast } from "@/shared/hooks/use-toast";

export async function compareProperties(properties: PropertyDetails[]): Promise<PropertyComparisonResponse> {
  try {
    console.log("Sending properties for comparison:", properties);
    
    const { data, error } = await supabase.functions.invoke('property-comparison', {
      body: { properties }
    });

    if (error) {
      console.error("Error from property-comparison function:", error);
      throw new Error(error.message || "Error comparing properties");
    }

    if (!data) {
      throw new Error("No data returned from property comparison");
    }

    console.log("Comparison results:", data);
    return data;
  } catch (error: any) {
    console.error("Error in compareProperties:", error);
    
    toast({
      title: "Property Comparison Failed",
      description: error.message || "Unable to compare properties. Please try again.",
      variant: "destructive",
    });
    
    throw error;
  }
}
