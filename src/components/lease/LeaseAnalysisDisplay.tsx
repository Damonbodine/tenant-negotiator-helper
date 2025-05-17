
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeaseAnalyzerCard } from './LeaseAnalyzerCard';
import ReactMarkdown from 'react-markdown';
import { Progress } from "@/components/ui/progress";

interface Flag {
  level: 'high' | 'medium' | 'low';
  clause: string;
  line: number;
}

interface LeaseAnalysisData {
  rent: number;
  deposit: number;
  termMonths: number;
  flags: Flag[];
  summary: string;
}

interface LeaseAnalysisDisplayProps {
  analysis: LeaseAnalysisData | null;
  isLoading: boolean;
  progress: number;
}

export function LeaseAnalysisDisplay({ analysis, isLoading, progress }: LeaseAnalysisDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Analyzing your lease document...</h3>
        <Progress value={progress} className="h-2 w-full" />
        <p className="text-sm text-muted-foreground">
          This may take a minute or two. We're extracting key information and checking for potential issues.
        </p>
      </div>
    );
  }

  if (!analysis) return null;

  const getFlagColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1: Rent & Deposit */}
      <LeaseAnalyzerCard title="Rent & Deposit">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Rent</span>
            <span className="text-xl font-bold">${analysis.rent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Security Deposit</span>
            <span className="text-xl font-bold">${analysis.deposit.toLocaleString()}</span>
          </div>
        </div>
      </LeaseAnalyzerCard>

      {/* Card 2: Term */}
      <LeaseAnalyzerCard title="Lease Term">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Term Length</span>
            <span className="text-xl font-bold">{analysis.termMonths} months</span>
          </div>
        </div>
      </LeaseAnalyzerCard>

      {/* Card 3: Risk Flags */}
      <LeaseAnalyzerCard title="Risk Flags" className="md:col-span-2">
        {analysis.flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No risk flags detected in this lease.</p>
        ) : (
          <ul className="space-y-2">
            {analysis.flags.map((flag, index) => (
              <li key={index} className="flex items-start">
                <Badge variant="outline" className={`mr-2 ${getFlagColor(flag.level)}`}>
                  {flag.level.toUpperCase()}
                </Badge>
                <span className="text-sm">{flag.clause}</span>
              </li>
            ))}
          </ul>
        )}
      </LeaseAnalyzerCard>

      {/* Card 4: Negotiation Tips */}
      <LeaseAnalyzerCard title="Negotiation Tips" className="md:col-span-2">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{analysis.summary}</ReactMarkdown>
        </div>
      </LeaseAnalyzerCard>
    </div>
  );
}
