
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { useVoiceNegotiation } from "@/hooks/useVoiceNegotiation";
import { VoiceChat } from "@/components/negotiation/VoiceChat";
import { NegotiationControls } from "@/components/negotiation/NegotiationControls";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";

export const NegotiationPractice = () => {
  const [selectedScenario, setSelectedScenario] = useState("standard");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  const {
    messages,
    input,
    setInput,
    isListening,
    isCallActive,
    isLoading,
    isMuted,
    selectedVoice,
    availableVoices,
    startCall,
    endCall,
    handleSend,
    toggleListening,
    toggleMute,
    handleVoiceChange
  } = useVoiceNegotiation(selectedScenario);
  
  const openSettings = () => setShowApiKeyInput(true);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Practice Negotiation Calls</h2>
          <p className="text-muted-foreground mt-1">
            Improve your rental negotiation skills with interactive voice practice
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col shadow-md border-blue-100">
            <CardHeader className="pb-2 flex flex-row justify-between items-center bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
              <div>
                <CardTitle>Negotiation Simulator</CardTitle>
                <CardDescription>
                  Practice your negotiation skills with an AI landlord
                </CardDescription>
              </div>
              <NegotiationControls 
                isCallActive={isCallActive}
                isMuted={isMuted}
                startCall={startCall}
                endCall={endCall}
                toggleMute={toggleMute}
                openSettings={openSettings}
                selectedVoice={selectedVoice}
                handleVoiceChange={handleVoiceChange}
                availableVoices={availableVoices}
              />
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden">
              <VoiceChat 
                messages={messages}
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                isListening={isListening}
                isCallActive={isCallActive}
                toggleListening={toggleListening}
                handleSend={handleSend}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
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
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={() => setShowApiKeyInput(false)} />
      )}
    </div>
  );
};
