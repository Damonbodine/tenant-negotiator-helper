
import { Card } from "@/shared/ui/card";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <Card className="max-w-[80%] p-3 bg-card border border-border">
        <div className="flex space-x-2 items-center">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150" />
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300" />
          <span className="text-sm text-muted-foreground ml-1">Thinking...</span>
        </div>
      </Card>
    </div>
  );
}
