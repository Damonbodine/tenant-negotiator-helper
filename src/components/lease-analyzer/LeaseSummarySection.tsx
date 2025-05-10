import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Shield } from "lucide-react";

interface ComplexTerm {
  term: string;
  explanation: string;
}

interface UnusualClause {
  clause: string;
  concern: string;
  riskLevel?: string;
}

interface ExtractionConfidence {
  rent?: "high" | "medium" | "low";
  securityDeposit?: "high" | "medium" | "low";
  lateFee?: "high" | "medium" | "low";
  term?: "high" | "medium" | "low";
  utilities?: "high" | "medium" | "low";
}

interface LeaseSummarySectionProps {
  summary: string;
  complexTerms: ComplexTerm[];
  unusualClauses: UnusualClause[];
  questions: string[];
  confidence?: ExtractionConfidence;
}

export function LeaseSummarySection({ 
  summary, 
  complexTerms, 
  unusualClauses, 
  questions,
  confidence
}: LeaseSummarySectionProps) {
  
  const getConfidenceBadge = (level?: string) => {
    if (!level) return null;
    
    switch(level) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" /> High confidence
        </span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
          Medium confidence
        </span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" /> Low confidence
        </span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Lease Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-cyan-100/90">{summary}</p>
          
          {confidence && Object.keys(confidence).length > 0 && (
            <div className="mt-6 p-4 bg-cyan-950/40 rounded-md">
              <h4 className="font-medium text-cyan-400 mb-3">Data Extraction Confidence</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {confidence.rent && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-cyan-100/80">Rent Amount</span>
                    {getConfidenceBadge(confidence.rent)}
                  </div>
                )}
                {confidence.securityDeposit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-cyan-100/80">Security Deposit</span>
                    {getConfidenceBadge(confidence.securityDeposit)}
                  </div>
                )}
                {confidence.lateFee && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-cyan-100/80">Late Fee</span>
                    {getConfidenceBadge(confidence.lateFee)}
                  </div>
                )}
                {confidence.term && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-cyan-100/80">Lease Term</span>
                    {getConfidenceBadge(confidence.term)}
                  </div>
                )}
                {confidence.utilities && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-cyan-100/80">Utilities</span>
                    {getConfidenceBadge(confidence.utilities)}
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-xs text-cyan-100/70">
                <p>Low confidence items may require verification. Please check the extracted information carefully.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Shield className="h-5 w-5" /> Complex Legal Terms
          </CardTitle>
          <CardDescription>Legal language explained in plain English</CardDescription>
        </CardHeader>
        <CardContent>
          {complexTerms && complexTerms.length > 0 ? (
            <div className="space-y-4">
              {complexTerms.map((term, index) => (
                <div key={index} className="p-4 bg-cyan-950/40 rounded-lg">
                  <h4 className="font-medium text-cyan-400">{term.term}</h4>
                  <p className="mt-2 text-cyan-100/90">{term.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cyan-100/90">No complex terms identified.</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <AlertTriangle className="h-5 w-5" /> Unusual or Concerning Clauses
          </CardTitle>
          <CardDescription>Clauses that may be unfavorable to tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {unusualClauses && unusualClauses.length > 0 ? (
            <div className="space-y-4">
              {unusualClauses.map((clause, index) => (
                <div key={index} className="p-4 bg-cyan-950/40 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-cyan-400">{clause.clause}</h4>
                    {clause.riskLevel && (
                      <span className={`px-2 py-1 rounded text-xs font-medium 
                        ${clause.riskLevel === 'high' ? 'bg-red-500/20 text-red-300' : 
                          clause.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                          'bg-green-500/20 text-green-300'}`}>
                        {clause.riskLevel} risk
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-cyan-100/90">{clause.concern}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cyan-100/90">No unusual clauses identified.</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Questions to Ask Before Signing</CardTitle>
        </CardHeader>
        <CardContent>
          {questions && questions.length > 0 ? (
            <ul className="space-y-2">
              {questions.map((question, index) => (
                <li key={index} className="flex items-start gap-2 text-cyan-100/90">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 mt-2.5 flex-shrink-0"></div>
                  {question}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-cyan-100/90">No specific questions recommended.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
