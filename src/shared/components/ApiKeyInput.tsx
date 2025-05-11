
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { voiceClient } from "@/shared/services/voiceClient";

interface ApiKeyInputProps {
  keyType?: string; // Make keyType optional to match our main ApiKeyInput component
  onClose: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError("Please enter a valid API key");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await voiceClient.setApiKey(apiKey);
      onClose();
    } catch (error) {
      console.error("Error setting API key:", error);
      setError("Failed to validate the API key. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ElevenLabs API Key</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter your ElevenLabs API key to enable text-to-speech functionality.
              You can get your API key from{" "}
              <a 
                href="https://elevenlabs.io/app/api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                elevenlabs.io
              </a>
            </p>
            
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              autoFocus
              aria-label="ElevenLabs API Key"
            />
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => onClose()}
              variant="outline" 
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
