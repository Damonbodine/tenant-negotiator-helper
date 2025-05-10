import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClaudeApiKeyInputProps {
  onClose: () => void;
}

export const ClaudeApiKeyInput = ({ onClose }: ClaudeApiKeyInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // This component is no longer used
  // Just close it immediately
  
  return null;
};
