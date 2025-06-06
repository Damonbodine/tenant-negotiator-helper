
import { Card } from "@/shared/ui/card";

export function LoadingIndicator() {
  return (
    <div className="flex justify-start" aria-live="polite">
      <Card className="max-w-[80%] p-3 bg-muted border border-border">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-300" />
        </div>
      </Card>
    </div>
  );
}
