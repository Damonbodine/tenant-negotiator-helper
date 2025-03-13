
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";

interface ApiKeyInputProps {
  onClose: () => void;
}

export const ApiKeyInput = ({ onClose }: ApiKeyInputProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const savedKey = localStorage.getItem("elevenlabs_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);
  
  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your ElevenLabs API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      agentService.setApiKey(apiKey);
      toast({
        title: "API Key Saved",
        description: "Your ElevenLabs API key has been saved",
      });
      onClose();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ElevenLabs API Key</DialogTitle>
          <DialogDescription>
            Enter your ElevenLabs API key to enable the AI voice agent.
            Get your API key at{" "}
            <a 
              href="https://elevenlabs.io/app/api" 
              target="_blank" 
              rel="noreferrer"
              className="text-negotiator-500 hover:underline"
            >
              elevenlabs.io
            </a>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter your ElevenLabs API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full"
            type="password"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
