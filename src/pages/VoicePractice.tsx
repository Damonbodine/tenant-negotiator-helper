
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";
import { PracticeHeader } from "@/components/negotiation/PracticeHeader";
import { ElevenLabsWidget } from "@/components/negotiation/ElevenLabsWidget";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

const VoicePractice = () => {
  // Updated to use "random" as the default scenario
  const [selectedScenario, setSelectedScenario] = useState("random");
  
  return <div className="container py-6">
      <div className="space-y-6">
        {/* Header section with standardized back button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Voice Practice</h1>
          <Button variant="ghost" size="sm" asChild className="hover:bg-cyan-950/30">
            <Link to="/" className="flex items-center gap-1 text-cyan-400">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Main content section with custom layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side: Practice Scenarios */}
          <div className="lg:w-1/2">
            <Card className="shadow-md border-blue-100 h-full">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b bg-slate-500">
                <CardTitle className="text-slate-950">Random Scenario Generator</CardTitle>
                <CardDescription className="text-slate-950">
                  Generate randomized negotiation scenarios to practice
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ScenarioSelector selectedScenario={selectedScenario} onScenarioChange={setSelectedScenario} />
              </CardContent>
            </Card>
          </div>
          
          {/* Right side: Voice Practice */}
          <div className="lg:w-1/2">
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b bg-slate-500">
                <CardTitle className="text-slate-950">Voice Practice</CardTitle>
                <CardDescription className="text-slate-950">
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
    </div>;
};

export default VoicePractice;
