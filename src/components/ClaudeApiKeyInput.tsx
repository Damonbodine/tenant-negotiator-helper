
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { saveApiKey, getApiKey } from "@/utils/keyManager";

interface ClaudeApiKeyInputProps {
  onClose: () => void;
  isRequired?: boolean;
}

export const ClaudeApiKeyInput = ({ onClose, isRequired = false }: ClaudeApiKeyInputProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchApiKey = async () => {
      const savedKey = await getApiKey('CLAUDE');
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
        description: "Please enter your Claude API Key",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await saveApiKey('CLAUDE', apiKey);
      
      toast({
        title: "API Key Saved",
        description: "Your Claude API Key has been saved",
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
          <DialogTitle>Claude API Key</DialogTitle>
          <DialogDescription>
            {isRequired 
              ? "Enter your Claude API key to enable advanced lease analysis."
              : "Add your own Claude API key to use for lease analysis (optional)."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Claude API Key
              <span className="ml-1 text-xs text-muted-foreground">
                (<a 
                  href="https://console.anthropic.com/settings/keys" 
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
              placeholder="Enter your Claude API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
              type="password"
            />
          </div>
        </div>
        
        <DialogFooter>
          {!isRequired && (
            <Button variant="ghost" onClick={onClose}>Skip</Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
