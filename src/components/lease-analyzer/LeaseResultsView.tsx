
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LeaseAnalysisResult } from "./types";
import { LeaseFinancialSection } from "./LeaseFinancialSection";
import { LeaseTermSection } from "./LeaseTermSection";
import { LeaseSummarySection } from "./LeaseSummarySection";
import { LeasePartiesSection } from "./LeasePartiesSection";
import { LeasePropertySection } from "./LeasePropertySection";
import { LeaseResponsibilitiesSection } from "./LeaseResponsibilitiesSection";
import { LeaseCriticalDatesSection } from "./LeaseCriticalDatesSection";
import { LeaseRedFlagsSection } from "./LeaseRedFlagsSection";

interface LeaseResultsViewProps {
  analysis: LeaseAnalysisResult;
  onAnalyzeAnother: () => void;
}

export function LeaseResultsView({ analysis, onAnalyzeAnother }: LeaseResultsViewProps) {
  return (
    <div className="space-y-6">
      <LeaseSummarySection analysis={analysis} onAnalyzeAnother={onAnalyzeAnother} />
      
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="pets">Pet Policy</TabsTrigger>
          <TabsTrigger value="responsibilities">Responsibilities</TabsTrigger>
          <TabsTrigger value="dates">Critical Dates</TabsTrigger>
          <TabsTrigger value="redflags">Red Flags</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financial">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeaseFinancialSection financialTerms={analysis.financialTerms} />
          </Card>
        </TabsContent>
        
        <TabsContent value="terms">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeaseTermSection leaseTerms={analysis.leaseTerms} />
          </Card>
        </TabsContent>
        
        <TabsContent value="property">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeasePropertySection propertyDetails={analysis.propertyDetails} />
          </Card>
        </TabsContent>
        
        <TabsContent value="parties">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeasePartiesSection parties={analysis.parties} />
          </Card>
        </TabsContent>
        
        <TabsContent value="pets">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <div className="p-6">
              <h3 className="text-xl font-medium text-cyan-400 mb-4">Pet Policy</h3>
              {analysis.petPolicy ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-cyan-950/40 p-4 rounded-md">
                      <p className="text-sm text-cyan-100/80">
                        <span className="font-medium block">Pets Allowed:</span>
                        {analysis.petPolicy.allowed ? "Yes" : "No"}
                      </p>
                    </div>
                    
                    {analysis.petPolicy.restrictions && (
                      <div className="bg-cyan-950/40 p-4 rounded-md">
                        <p className="text-sm text-cyan-100/80">
                          <span className="font-medium block">Restrictions:</span>
                          {analysis.petPolicy.restrictions}
                        </p>
                      </div>
                    )}
                    
                    {analysis.petPolicy.petRent !== undefined && (
                      <div className="bg-cyan-950/40 p-4 rounded-md">
                        <p className="text-sm text-cyan-100/80">
                          <span className="font-medium block">Pet Rent:</span>
                          ${analysis.petPolicy.petRent}/month
                        </p>
                      </div>
                    )}
                    
                    {analysis.petPolicy.petDeposit !== undefined && (
                      <div className="bg-cyan-950/40 p-4 rounded-md">
                        <p className="text-sm text-cyan-100/80">
                          <span className="font-medium block">Pet Deposit:</span>
                          ${analysis.petPolicy.petDeposit}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-cyan-100/80">No pet policy information found in the lease.</p>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="responsibilities">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeaseResponsibilitiesSection responsibilities={analysis.responsibilities} />
          </Card>
        </TabsContent>
        
        <TabsContent value="dates">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeaseCriticalDatesSection criticalDates={analysis.criticalDates} />
          </Card>
        </TabsContent>
        
        <TabsContent value="redflags">
          <Card className="border-cyan-400/30 bg-cyan-950/20">
            <LeaseRedFlagsSection redFlags={analysis.redFlags} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
