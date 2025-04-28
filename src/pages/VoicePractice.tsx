
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
          {/* Left side: Practice Scenarios */}
          <div className="lg:w-1/2">
            <Card className="shadow-md border-blue-100 h-full">
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
          </div>
          
          {/* Right side: Voice Practice */}
          <div className="lg:w-1/2">
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>Voice Practice</CardTitle>
                <CardDescription>
                  Practice your negotiation skills with our AI voice assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {/* ElevenLabs Widget */}
                <ElevenLabsWidget />
                
                {/* Quick Tips section moved inside the Voice Practice card */}
                <QuickTips />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePractice;
