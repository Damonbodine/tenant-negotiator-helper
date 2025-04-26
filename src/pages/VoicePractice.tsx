
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";
import { useState } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

const VoicePractice = () => {
  const [selectedScenario, setSelectedScenario] = useState("standard");

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Practice Negotiation Calls</h2>
            <p className="text-muted-foreground mt-1">
              Improve your rental negotiation skills with interactive voice practice
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main content area - taking 8 columns on large screens */}
          <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>Practice with AI Landlord</CardTitle>
                <CardDescription>
                  Start a conversation with our AI landlord to practice your negotiation skills
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <elevenlabs-convai agent-id="4uRI9hKr0Mhg7DbwaLDD"></elevenlabs-convai>
              </CardContent>
            </Card>
          </div>
          
          {/* Scenarios on the right - taking 4 columns on large screens */}
          <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>Practice Scenarios</CardTitle>
                <CardDescription>
                  Choose a scenario to practice different negotiation contexts
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ScenarioSelector 
                  selectedScenario={selectedScenario}
                  onScenarioChange={setSelectedScenario}
                />
              </CardContent>
            </Card>
            
            <QuickTips />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePractice;
