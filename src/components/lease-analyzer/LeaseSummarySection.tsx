
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";

interface LeaseSummarySectionProps {
  analysis: LeaseAnalysisResult;
  onAnalyzeAnother: () => void;
}

export function LeaseSummarySection({ analysis, onAnalyzeAnother }: LeaseSummarySectionProps) {
  return (
    <>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-cyan-400">Lease Analysis Results</CardTitle>
            <CardDescription>
              AI-powered summary and analysis of your lease document
            </CardDescription>
          </div>
          <Button 
            onClick={onAnalyzeAnother} 
            variant="outline"
          >
            Analyze Another Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-cyan-950/40 p-6 rounded-lg border border-cyan-800/30">
            <h3 className="text-xl font-medium text-cyan-400 mb-4">Summary</h3>
            <p className="text-cyan-100/80 whitespace-pre-line">{analysis.summary}</p>
          </div>
          
          {analysis.confidence && (
            <div className="bg-cyan-950/30 p-4 rounded-md">
              <p className="text-sm text-cyan-100/70">
                <span className="font-medium">Analysis Confidence:</span> {Math.round(analysis.confidence * 100)}%
              </p>
              <p className="text-xs text-cyan-100/60 mt-1">
                This is our AI's confidence level in extracting and interpreting your lease terms. 
                Lower confidence may indicate unclear or complex language in the document.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}
