
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveApiKey, getApiKey } from "@/utils/keyManager";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyInputProps {
  keyType: string;
  onClose: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ keyType, onClose }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Get key descriptions and links 
  const keyMappings = {
    'CLAUDE': {
      displayName: 'Claude API Key',
      envName: 'ANTHROPIC_API_KEY',
      description: 'Used for Anthropic Claude 3 document analysis',
      link: 'https://console.anthropic.com/keys'
    },
    'GOOGLE': {
      displayName: 'Google Document AI API Key',
      envName: 'GOOGLE_DOCUMENTAI_API_KEY',
      description: 'Used for Google Document AI processing',
      link: 'https://console.cloud.google.com/apis/credentials'
    },
    'OPENAI': {
      displayName: 'OpenAI API Key',
      envName: 'OPENAI_RENTERS_MENTOR_KEY',
      description: 'Used for OpenAI GPT-4 fallback processing',
      link: 'https://platform.openai.com/api-keys'
    }
  };

  const keyInfo = keyMappings[keyType] || {
    displayName: `${keyType} API Key`,
    envName: keyType,
    description: 'API key for external service',
    link: '#'
  };

  // Load the existing API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const existingKey = await getApiKey(keyInfo.envName);
        if (existingKey) {
          setApiKey(existingKey);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      }
    };
    
    fetchApiKey();
  }, [keyType, keyInfo.envName]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveApiKey(keyInfo.envName, apiKey);
      toast({
        title: "API Key Saved",
        description: `Your ${keyInfo.displayName} has been saved locally.`,
      });
      onClose();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        variant: "destructive",
        title: "Error Saving API Key",
        description: "Failed to save your API key. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{keyInfo.displayName}</DialogTitle>
          <DialogDescription>
            {keyInfo.description}. Your key is stored securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={`Enter your ${keyInfo.displayName}...`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <a 
              href={keyInfo.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get your {keyInfo.displayName} here
            </a>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !apiKey}>
            {isLoading ? "Saving..." : "Save Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
