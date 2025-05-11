
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalysisResults {
  summary: string;
  extractedData?: {
    financial?: {
      rent?: {
        amount?: number | null;
        frequency?: string;
      };
      securityDeposit?: number | null;
    };
  };
  regexFindings?: {
    potentialRentValues: number[] | null;
    potentialDepositValues: number[] | null;
  };
  rentVerificationNeeded?: boolean;
  alternativeRentValues?: number[];
  regexRentValues?: number[];
}

interface LeaseVerificationSectionProps {
  analysisResults: AnalysisResults;
  onUpdate: (field: string, value: any) => void;
}

export function LeaseVerificationSection({ analysisResults, onUpdate }: LeaseVerificationSectionProps) {
  const [rentAmount, setRentAmount] = useState<number | string>("");
  const [rentFrequency, setRentFrequency] = useState("monthly");
  const [securityDeposit, setSecurityDeposit] = useState<number | string>("");
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    // Check if verification is needed
    const needsVerification = 
      analysisResults.rentVerificationNeeded || 
      (analysisResults.regexRentValues && analysisResults.regexRentValues.length > 0) ||
      (analysisResults.extractedData?.financial?.rent?.amount === null);
    
    setShowVerification(needsVerification);

    // Set initial values from analysis
    if (analysisResults.extractedData?.financial?.rent?.amount) {
      setRentAmount(analysisResults.extractedData.financial.rent.amount);
    }
    
    if (analysisResults.extractedData?.financial?.rent?.frequency) {
      setRentFrequency(analysisResults.extractedData.financial.rent.frequency);
    }
    
    if (analysisResults.extractedData?.financial?.securityDeposit) {
      setSecurityDeposit(analysisResults.extractedData.financial.securityDeposit);
    }
  }, [analysisResults]);

  const handleRentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRentAmount(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onUpdate("financial", {
        rent: {
          amount: numericValue,
          frequency: rentFrequency
        }
      });
    }
  };

  const handleRentFrequencyChange = (value: string) => {
    setRentFrequency(value);
    const numericRentAmount = typeof rentAmount === 'string' ? parseFloat(rentAmount) : rentAmount;
    
    if (!isNaN(numericRentAmount)) {
      onUpdate("financial", {
        rent: {
          amount: numericRentAmount,
          frequency: value
        }
      });
    }
  };

  const handleSecurityDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSecurityDeposit(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onUpdate("financial", {
        securityDeposit: numericValue
      });
    }
  };

  // If no verification is needed, don't show this component
  if (!showVerification) {
    return null;
  }

  return (
    <div className="space-y-6 py-4">
      {analysisResults.rentVerificationNeeded && (
        <Alert className="bg-amber-950/30 border-amber-400/30">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertTitle>Verification Needed</AlertTitle>
          <AlertDescription>
            We found multiple possible rent values in your lease. Please confirm the correct amount.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rent-amount">Monthly Rent Amount</Label>
            <Input
              id="rent-amount"
              type="number"
              placeholder="Enter rent amount"
              value={rentAmount}
              onChange={handleRentAmountChange}
            />
            
            {analysisResults.regexRentValues && analysisResults.regexRentValues.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Possible values found: {analysisResults.regexRentValues.map(v => `$${v}`).join(', ')}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rent-frequency">Frequency</Label>
            <Select value={rentFrequency} onValueChange={handleRentFrequencyChange}>
              <SelectTrigger id="rent-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="security-deposit">Security Deposit</Label>
          <Input
            id="security-deposit"
            type="number"
            placeholder="Enter security deposit"
            value={securityDeposit}
            onChange={handleSecurityDepositChange}
          />
          
          {analysisResults.regexFindings?.potentialDepositValues && (
            <div className="text-xs text-muted-foreground mt-1">
              Possible values found: {analysisResults.regexFindings.potentialDepositValues.map(v => `$${v}`).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
