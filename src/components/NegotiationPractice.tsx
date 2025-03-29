
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { useVoiceNegotiation } from "@/hooks/useVoiceNegotiation";
import { VoiceChat } from "@/components/negotiation/VoiceChat";
import { NegotiationControls } from "@/components/negotiation/NegotiationControls";
import { ScenarioSelector } from "@/components/negotiation/ScenarioSelector";
import { QuickTips } from "@/components/negotiation/QuickTips";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApartmentAnalysis } from "@/components/negotiation/ApartmentAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const NegotiationPractice = () => {
  const [selectedScenario, setSelectedScenario] = useState("standard");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [useElevenLabsWidget, setUseElevenLabsWidget] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'analysis'>('practice');
  
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
  
  const toggleElevenLabsWidget = () => {
    setUseElevenLabsWidget(!useElevenLabsWidget);
  };
  
  return (
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
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'practice' | 'analysis')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="practice">Voice Practice</TabsTrigger>
          <TabsTrigger value="analysis">Apartment Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="practice" className="mt-0">
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
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ApartmentAnalysis />
            </div>
            
            <div className="space-y-6">
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                  <CardTitle>Why Analyze Apartments?</CardTitle>
                  <CardDescription>
                    Data-driven negotiation starts with market research
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <LinkIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Enter a Zillow Link</h3>
                        <p className="text-sm text-muted-foreground">Paste the URL of any Zillow rental listing to get started</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Building className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Compare with Similar Rentals</h3>
                        <p className="text-sm text-muted-foreground">See how the price compares to similar apartments in the area</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <ExternalLink className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Get Negotiation Advice</h3>
                        <p className="text-sm text-muted-foreground">Receive tailored negotiation strategies based on market analysis</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                  <CardTitle>Negotiation Tips</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    <li className="text-sm">• Know market rates before negotiating</li>
                    <li className="text-sm">• Mention comparable units in your area</li>
                    <li className="text-sm">• Be prepared to justify your counteroffer</li>
                    <li className="text-sm">• Ask for concessions beyond just rent</li>
                    <li className="text-sm">• Consider offering a longer lease term</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={() => setShowApiKeyInput(false)} />
      )}
    </div>
  );
};
