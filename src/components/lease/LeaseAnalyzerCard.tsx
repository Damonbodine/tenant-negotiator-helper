
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaseAnalyzerCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function LeaseAnalyzerCard({ title, children, className }: LeaseAnalyzerCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
