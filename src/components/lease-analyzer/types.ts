
export interface LeaseAnalysisResult {
  summary: string;
  confidence: number;
  financialTerms?: {
    monthlyRent?: number;
    securityDeposit?: number;
    lateFees?: string;
    otherFees?: string[];
  };
  leaseTerms?: {
    startDate?: string;
    endDate?: string;
    leaseTerm?: string;
    renewalTerms?: string;
    noticeRequired?: string;
  };
  propertyDetails?: {
    address?: string;
    unitNumber?: string;
    includedAmenities?: string[];
  };
  parties?: {
    landlord?: string;
    tenant?: string[];
    propertyManager?: string;
  };
  petPolicy?: {
    allowed: boolean;
    restrictions?: string;
    petRent?: number;
    petDeposit?: number;
  };
  responsibilities?: {
    tenant?: string[];
    landlord?: string[];
  };
  criticalDates?: {
    moveIn?: string;
    moveOut?: string;
    rentDueDate?: string;
    lateFeeDate?: string;
  };
  redFlags?: {
    issues: string[];
    severity: "low" | "medium" | "high";
  }[];
}

export interface LeaseAnalyzerResponse {
  analysis: LeaseAnalysisResult;
  error?: string;
}
