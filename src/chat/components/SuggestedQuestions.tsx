
import { Button } from "@/shared/ui/button";
import { MessageSquare } from "lucide-react";

interface SuggestedQuestionsProps {
  suggestions: string[];
  onSelect: (question: string) => void;
  className?: string;
}

export function SuggestedQuestions({ suggestions, onSelect, className = "" }: SuggestedQuestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Suggested questions">
      {suggestions.map((question) => (
        <Button
          key={question}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-sm"
          onClick={() => onSelect(question)}
        >
          <MessageSquare className="h-4 w-4" />
          {question}
        </Button>
      ))}
    </div>
  );
}
