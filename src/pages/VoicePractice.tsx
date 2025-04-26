
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";
import { PracticeHeader } from "@/components/negotiation/PracticeHeader";
import { ElevenLabsWidget } from "@/components/negotiation/ElevenLabsWidget";

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
        {/* Header section */}
        <PracticeHeader />

        {/* Main content section with custom layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side: ElevenLabs widget */}
          <div className="lg:w-2/3">
            <Card className="shadow-md border-blue-100 h-full">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>Practice with AI Landlord</CardTitle>
                <CardDescription>
                  Start a conversation with our AI landlord to practice your negotiation skills
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ElevenLabsWidget />
              </CardContent>
            </Card>
          </div>
          
          {/* Right side: Scenarios and Tips */}
          <div className="lg:w-1/3 space-y-6">
            {/* Scenarios section */}
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
            
            {/* Quick Tips section */}
            <QuickTips />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePractice;
