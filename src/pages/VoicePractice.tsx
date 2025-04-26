
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";
import { useState, useEffect, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

const VoicePractice = () => {
  const [selectedScenario, setSelectedScenario] = useState("standard");
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  
  // Effect to ensure widget script is loaded and positioned correctly
  useEffect(() => {
    // Add custom styles to head
    const style = document.createElement('style');
    style.textContent = `
      elevenlabs-convai {
        position: fixed !important;
        bottom: 20px !important;
        left: 20px !important;
        right: auto !important;
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);

    // Load widget script if not already present
    if (!document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]')) {
      const script = document.createElement('script');
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }

    // Add load event listener for additional positioning
    window.addEventListener('load', function positionWidget() {
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        widget.style.position = 'fixed';
        widget.style.bottom = '20px';
        widget.style.left = '20px';
        widget.style.right = 'auto';
        widget.style.zIndex = '9999';
      }
      // Clean up event listener after execution
      window.removeEventListener('load', positionWidget);
    });

    return () => {
      // Cleanup: remove style element on component unmount
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container py-6">
      <div className="space-y-6">
        {/* Header section */}
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
                <div ref={widgetContainerRef} className="elevenlabs-widget-container min-h-[400px]">
                  <elevenlabs-convai agent-id="VT5HhuEwB5po9ZHZGcOk"></elevenlabs-convai>
                </div>
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
