
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollapsibleMessageProps {
  text: string;
  maxHeight?: number;
  className?: string;
}

export function CollapsibleMessage({ text, maxHeight = 400, className }: CollapsibleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapsing, setNeedsCollapsing] = useState(false);
  const messageRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Check if the content exceeds the max height
    if (messageRef.current && messageRef.current.scrollHeight > maxHeight) {
      setNeedsCollapsing(true);
    } else {
      setNeedsCollapsing(false);
    }
  }, [text, maxHeight]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={messageRef}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          !isExpanded && needsCollapsing && "max-h-[400px] overflow-hidden"
        )}
      >
        {text}
      </div>
      
      {needsCollapsing && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0",
          !isExpanded && "bg-gradient-to-t from-background to-transparent h-16 flex items-end justify-center pb-2",
          isExpanded && "relative mt-4 flex justify-center"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show More <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
