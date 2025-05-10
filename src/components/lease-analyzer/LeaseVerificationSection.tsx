
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

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

  // Initialize form with values from analysis
  useEffect(() => {
    if (analysisResults?.extractedData?.financial?.rent?.amount) {
      setRentAmount(analysisResults.extractedData.financial.rent.amount.toString());
      setFrequency(analysisResults.extractedData.financial.rent.frequency || 'monthly');
    }
    
    if (analysisResults?.extractedData?.financial?.securityDeposit) {
      setSecurityDeposit(analysisResults.extractedData.financial.securityDeposit.toString());
    }
  }, [analysisResults]);

  // Update parent component when values change
  const handleRentChange = (value: string) => {
    setRentAmount(value);
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

  return (
    <div className="space-y-4 my-4">
      <Card className="border-amber-300/30 bg-amber-50/10">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rent-amount" className="text-sm font-medium flex items-center gap-2">
                Monthly Rent
                {(analysisResults.rentVerificationNeeded || 
                  analysisResults?.extractionConfidence?.rent === 'low') && (
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
              
              {analysisResults.alternativeRentValues && 
               analysisResults.alternativeRentValues.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-700 mb-2">We found other possible rent values in your document:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.alternativeRentValues.map((value, index) => (
                      <button
                        key={index}
                        onClick={() => handleRentChange(value.toString())}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded-md"
                      >
                        {formatCurrency(value)}
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
          
          <div className="mt-4 p-3 bg-amber-50/20 border border-amber-300/30 rounded-md">
            <p className="text-xs text-amber-800">
              <strong>Why verify?</strong> Our AI found these values in your lease document, but 
              we want to make sure they're accurate. Confirming these details helps us provide more 
              reliable analysis of your lease agreement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
