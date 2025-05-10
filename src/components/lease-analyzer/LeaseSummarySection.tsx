
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ComplexTerm {
  term: string;
  explanation: string;
}

interface UnusualClause {
  clause: string;
  concern: string;
  riskLevel?: "high" | "medium" | "low";
}

interface LeaseSummarySectionProps {
  summary: string;
  complexTerms: ComplexTerm[];
  unusualClauses: UnusualClause[];
  questions: string[];
}

export function LeaseSummarySection({ 
  summary, 
  complexTerms, 
  unusualClauses, 
  questions 
}: LeaseSummarySectionProps) {
  // Function to get the correct color based on risk level
  const getRiskLevelColor = (riskLevel: string | undefined) => {
    switch(riskLevel) {
      case "high": return "text-red-500";
      case "medium": return "text-amber-400";
      case "low": return "text-green-400";
      default: return "text-amber-400"; // Default if not specified
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-cyan-100/90">{summary}</p>
        </CardContent>
      </Card>

      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Complex Terms Explained</CardTitle>
          <CardDescription>Legal jargon translated into plain language</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {complexTerms.map((term, index) => (
              <li key={index} className="pb-4 border-b border-cyan-400/20 last:border-b-0">
                <h4 className="font-semibold text-cyan-400 mb-2">{term.term}</h4>
                <p className="text-cyan-100/90">{term.explanation}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Unusual Clauses</CardTitle>
          <CardDescription>Potentially problematic terms you should review</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {unusualClauses.map((clause, index) => (
              <li key={index} className="pb-4 border-b border-cyan-400/20 last:border-b-0 flex gap-3">
                <AlertCircle className={`h-6 w-6 shrink-0 mt-0.5 ${getRiskLevelColor(clause.riskLevel)}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold mb-2 ${getRiskLevelColor(clause.riskLevel)}`}>{clause.clause}</h4>
                    {clause.riskLevel && (
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        clause.riskLevel === 'high' ? 'bg-red-500/20 text-red-500' :
                        clause.riskLevel === 'medium' ? 'bg-amber-400/20 text-amber-400' :
                        'bg-green-400/20 text-green-400'
                      }`}>
                        {clause.riskLevel.toUpperCase()} RISK
                      </span>
                    )}
                  </div>
                  <p className="text-cyan-100/90">{clause.concern}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-cyan-400">Questions to Ask</CardTitle>
          <CardDescription>Consider discussing these points before signing</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {questions.map((question, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-cyan-100/90">{question}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
