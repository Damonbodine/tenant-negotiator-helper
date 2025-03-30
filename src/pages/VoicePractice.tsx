
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { useVoiceNegotiation } from "@/hooks/useVoiceNegotiation";
import { VoiceChat } from "@/components/negotiation/VoiceChat";
import { NegotiationControls } from "@/components/negotiation/NegotiationControls";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const VoicePractice = () => {
  const [selectedScenario, setSelectedScenario] = useState("random");
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
    microphoneAccessState,
    startCall,
    endCall,
    handleSend,
    toggleListening,
    toggleMute,
    handleVoiceChange
  } = useVoiceNegotiation(selectedScenario);
  
  const openSettings = () => setShowApiKeyInput(true);
  
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  ElevenLabs Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle>ElevenLabs Voice Chat Demo</DialogTitle>
                </DialogHeader>
                <div className="h-full">
                  <iframe 
                    src="https://elevenlabs.io/voice-lab/voice-chat" 
                    className="w-full h-full rounded-md border border-gray-200"
                    title="ElevenLabs Voice Chat Demo"
                  />
                </div>
              </DialogContent>
            </Dialog>
            
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
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
                  microphoneAccessState={microphoneAccessState}
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
                
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Having trouble with voice input?
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    If you're experiencing issues with voice input, try the ElevenLabs demo button at the top of the page for an alternative voice chat experience.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <QuickTips />
          </div>
        </div>
      </div>
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={() => setShowApiKeyInput(false)} />
      )}
    </div>
  );
};

export default VoicePractice;
