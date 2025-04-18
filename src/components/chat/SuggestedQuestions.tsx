
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
    <div className={`flex flex-wrap gap-2 mt-4 p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg ${className}`}>
      <div className="w-full text-sm text-blue-600 dark:text-blue-300 mb-2 font-medium">
        Suggested questions:
      </div>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800"
          onClick={() => onSelect(suggestion)}
        >
          <MessageSquare className="h-4 w-4" />
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
