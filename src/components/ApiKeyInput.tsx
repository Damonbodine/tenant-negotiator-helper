
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";
import { API_KEYS, ApiKeyConfig } from "@/utils/keyManager";

interface ApiKeyInputProps {
  onClose: () => void;
  keyType?: string; // Optional key type, defaults to ElevenLabs
}

export const ApiKeyInput = ({ onClose, keyType = 'ELEVEN_LABS' }: ApiKeyInputProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const keyConfig: ApiKeyConfig = API_KEYS[keyType];
  
  useEffect(() => {
    const fetchApiKey = async () => {
      const savedKey = await agentService.getApiKey();
      if (savedKey) {
        setApiKey(savedKey);
      }
    };
    
    fetchApiKey();
  }, []);
  
  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: `Please enter your ${keyConfig.name}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await agentService.setApiKey(apiKey);
      toast({
        title: "API Key Saved",
        description: `Your ${keyConfig.name} has been saved`,
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
          <DialogTitle>{keyConfig.name}</DialogTitle>
          <DialogDescription>
            Enter your {keyConfig.name} to enable the AI voice agent.
            Get your API key at{" "}
            <a 
              href={keyConfig.url} 
              target="_blank" 
              rel="noreferrer"
              className="text-negotiator-500 hover:underline"
            >
              {new URL(keyConfig.url).hostname}
            </a>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            placeholder={`Enter your ${keyConfig.name}`}
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
