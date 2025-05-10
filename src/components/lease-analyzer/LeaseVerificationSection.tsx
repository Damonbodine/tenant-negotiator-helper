
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalysisResults {
  extractedData?: {
    financial?: {
      rent?: { amount: number; frequency: string };
      securityDeposit?: number;
    };
  };
  extractionConfidence?: {
    rent?: "high" | "medium" | "low";
    securityDeposit?: "high" | "medium" | "low";
  };
  rentVerificationNeeded?: boolean;
  alternativeRentValues?: number[];
  regexRentValues?: number[];
}

interface LeaseVerificationSectionProps {
  analysisResults: AnalysisResults;
  onUpdate: (field: string, value: any) => void;
}

export function LeaseVerificationSection({ 
  analysisResults, 
  onUpdate 
}: LeaseVerificationSectionProps) {
  const [rentAmount, setRentAmount] = useState<string>('');
  const [securityDeposit, setSecurityDeposit] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [dataChanged, setDataChanged] = useState<boolean>(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);

  // Initialize form with values from analysis
  useEffect(() => {
    if (!initialDataLoaded && analysisResults?.extractedData?.financial) {
      if (analysisResults.extractedData.financial.rent?.amount) {
        setRentAmount(analysisResults.extractedData.financial.rent.amount.toString());
        setFrequency(analysisResults.extractedData.financial.rent.frequency || 'monthly');
      }
      
      if (analysisResults.extractedData.financial.securityDeposit) {
        setSecurityDeposit(analysisResults.extractedData.financial.securityDeposit.toString());
      }
      
      setInitialDataLoaded(true);
      setDataChanged(false);
    }
  }, [analysisResults, initialDataLoaded]);

  // Update parent component when values change
  const handleRentChange = (value: string) => {
    setRentAmount(value);
    setDataChanged(true);
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      onUpdate('financial', {
        ...analysisResults.extractedData?.financial,
        rent: {
          amount: numericValue,
          frequency: frequency
        }
      });
    }
  };

  const handleDepositChange = (value: string) => {
    setSecurityDeposit(value);
    setDataChanged(true);
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      onUpdate('financial', {
        ...analysisResults.extractedData?.financial,
        securityDeposit: numericValue
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Decide if we should show a more prominent alert about rent discrepancy
  const showRentAlert = analysisResults.rentVerificationNeeded || 
                        analysisResults?.extractionConfidence?.rent === 'low' ||
                        (analysisResults.regexRentValues && 
                         analysisResults.regexRentValues.length > 0 &&
                         !analysisResults.regexRentValues.includes(
                           analysisResults.extractedData?.financial?.rent?.amount || 0
                         ));

  // Count how many sources agree on each value
  const getValueFrequency = (value: number) => {
    let count = 0;
    
    // Check if AI extraction found this value
    if (analysisResults.extractedData?.financial?.rent?.amount === value) {
      count++;
    }
    
    // Check how many times this value appears in regex findings
    if (analysisResults.regexRentValues) {
      count += analysisResults.regexRentValues.filter(v => v === value).length;
    }
    
    // Check alternative values
    if (analysisResults.alternativeRentValues) {
      count += analysisResults.alternativeRentValues.filter(v => v === value).length;
    }
    
    return count > 1 ? `(Found ${count} times)` : "";
  };

  return (
    <div className="space-y-4 my-4">
      <Card className="border-amber-300/30 bg-amber-50/10">
        <CardContent className="pt-6">
          {showRentAlert && (
            <div className="mb-4 p-3 bg-amber-100/10 border border-amber-300/30 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-500 font-medium text-sm">Rent Amount Verification Needed</h4>
                <p className="text-xs text-amber-400/90 mt-1">
                  We detected possible different rent values in the lease. 
                  Please select the correct monthly rent from the options below or enter it manually.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rent-amount" className="text-sm font-medium flex items-center gap-2">
                Monthly Rent
                {showRentAlert && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </Label>
              <Input 
                id="rent-amount"
                type="number" 
                placeholder="Enter monthly rent amount"
                value={rentAmount}
                onChange={(e) => handleRentChange(e.target.value)}
                className="border-amber-300/50"
              />
              
              {/* Display ALL possible rent values for selection */}
              {(analysisResults.alternativeRentValues?.length > 0 || 
                analysisResults.regexRentValues?.length > 0) && (
                <div className="mt-2">
                  <p className="text-xs text-amber-700 mb-2">We found these possible rent values in your document:</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Combine and deduplicate all potential rent values */}
                    {Array.from(new Set([
                      ...(analysisResults.alternativeRentValues || []),
                      ...(analysisResults.regexRentValues || [])
                    ]))
                    .sort((a, b) => a - b)
                    .map((value, index) => (
                      <button
                        key={index}
                        onClick={() => handleRentChange(value.toString())}
                        className={`text-xs ${
                          parseFloat(rentAmount) === value 
                            ? 'bg-amber-300 text-amber-900' 
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        } px-2 py-1 rounded-md flex items-center gap-1`}
                      >
                        <span>{formatCurrency(value)}</span>
                        <span className="text-amber-600/80 text-xs">{getValueFrequency(value)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="security-deposit" className="text-sm font-medium flex items-center gap-2">
                Security Deposit
                {analysisResults?.extractionConfidence?.securityDeposit === 'low' && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </Label>
              <Input 
                id="security-deposit"
                type="number" 
                placeholder="Enter security deposit amount"
                value={securityDeposit}
                onChange={(e) => handleDepositChange(e.target.value)}
                className="border-amber-300/50"
              />
            </div>
          </div>
          
          {dataChanged && (
            <div className="mt-4 p-2 bg-green-50/20 border border-green-300/30 rounded-md flex items-center gap-1">
              <Info className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-600">
                Your changes will be applied when you click "Confirm & Continue"
              </p>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-amber-50/20 border border-amber-300/30 rounded-md flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Why verify?</strong> Our AI found these values in your lease document, but 
              we want to make sure they're accurate. Confirming these details helps us provide more 
              reliable analysis of your lease agreement. Rent amounts that appear in multiple places 
              are more likely to be correct.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
