
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface SuggestedQuestionsProps {
  suggestions: string[];
  onSelect: (question: string) => void;
  className?: string;
}

export function SuggestedQuestions({ suggestions, onSelect, className = "" }: SuggestedQuestionsProps) {
  if (!suggestions?.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          className="flex items-center gap-2 text-sm"
          onClick={() => onSelect(suggestion)}
        >
          <MessageSquare className="h-4 w-4" />
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
