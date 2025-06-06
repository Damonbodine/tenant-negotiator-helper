
import { Card } from "@/components/ui/card";

export function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <Card className="max-w-[80%] p-3 bg-card border border-border">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150" />
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300" />
        </div>
      </Card>
    </div>
  );
}
