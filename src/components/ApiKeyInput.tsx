
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { agentService } from "@/utils/agentService";
import { API_KEYS, ApiKeyConfig, saveApiKey, getApiKey } from "@/utils/keyManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApiKeyInputProps {
  onClose: () => void;
  keyType?: string; // Optional key type, defaults to ElevenLabs
}

export const ApiKeyInput = ({ onClose, keyType = 'ELEVEN_LABS' }: ApiKeyInputProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [selectedKeyType, setSelectedKeyType] = useState(keyType);
  const [isLoading, setIsLoading] = useState(false);
  const keyConfig: ApiKeyConfig = API_KEYS[selectedKeyType];
  
  useEffect(() => {
    const fetchApiKey = async () => {
      const savedKey = await getApiKey(selectedKeyType);
      if (savedKey) {
        setApiKey(savedKey);
      } else {
        setApiKey("");
      }
    };
    
    fetchApiKey();
  }, [selectedKeyType]);
  
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
      await saveApiKey(selectedKeyType, apiKey);
      
      // If ElevenLabs key, also update the agent service
      if (selectedKeyType === 'ELEVEN_LABS') {
        await agentService.setApiKey(apiKey);
      }
      
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
          <DialogTitle>API Key Manager</DialogTitle>
          <DialogDescription>
            Enter your API keys to enable the app features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="keyType" className="text-sm font-medium">API Key Type</label>
            <Select
              value={selectedKeyType}
              onValueChange={setSelectedKeyType}
            >
              <SelectTrigger id="keyType">
                <SelectValue placeholder="Select API key type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(API_KEYS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              {keyConfig.name}
              <span className="ml-1 text-xs text-muted-foreground">
                (<a 
                  href={keyConfig.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-negotiator-500 hover:underline"
                >
                  Get key
                </a>)
              </span>
            </label>
            <Input
              id="apiKey"
              placeholder={`Enter your ${keyConfig.name}`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
              type="password"
            />
          </div>
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
