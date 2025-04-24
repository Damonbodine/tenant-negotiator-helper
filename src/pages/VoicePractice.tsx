
import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VoicePractice = () => {
  const [selectedScenario, setSelectedScenario] = useState("random");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [elevenLabsDialogOpen, setElevenLabsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'builtin' | 'elevenlabs'>('builtin');
  
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
  
  useEffect(() => {
    // Auto-start call when component mounts (only for built-in chat)
    if (!isCallActive && availableVoices.length > 0 && activeTab === 'builtin') {
      startCall();
    }
  }, [availableVoices, isCallActive, startCall, activeTab]);
  
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
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'builtin' | 'elevenlabs')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="builtin">Built-in Chat</TabsTrigger>
            <TabsTrigger value="elevenlabs">ElevenLabs Widget</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builtin" className="mt-0">
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
                  </CardContent>
                </Card>
                
                <QuickTips />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="elevenlabs" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-[600px] shadow-md border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                    <CardTitle>ElevenLabs Voice Chat</CardTitle>
                    <CardDescription>
                      Use the official ElevenLabs voice chat for negotiation practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 h-[calc(100%-5rem)] flex items-center justify-center">
                    <div className="w-full h-full">
                      <elevenlabs-convai agent-id="4uRI9hKr0Mhg7DbwaLDD"></elevenlabs-convai>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="shadow-md border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                    <CardTitle>About ElevenLabs Voice Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This tab uses ElevenLabs' official voice chat widget for a high-quality voice experience.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The agent is specifically designed to help with rental negotiations and will provide realistic responses as a landlord.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try asking about rent prices, lease terms, or amenities to practice your negotiation skills.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <QuickTips />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {showApiKeyInput && (
        <ApiKeyInput onClose={() => setShowApiKeyInput(false)} />
      )}
    </div>
  );
};

export default VoicePractice;
