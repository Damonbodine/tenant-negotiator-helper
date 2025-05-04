
import { Card } from "@/shared/ui/card";
import { ChatMessage as ChatMessageType } from "@/shared/types";
import { CollapsibleMessage } from "@/components/chat/CollapsibleMessage";
import { CheckCheck, Clock } from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // Format the timestamp in a human-readable way
  const formattedTime = useMemo(() => {
    const timestamp = message.timestamp;
    return {
      relative: formatDistanceToNow(timestamp, { addSuffix: true }),
      exact: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }, [message.timestamp]);

  return (
    <div 
      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
      role={message.type === "agent" ? "status" : undefined}
    >
      <Card 
        className={`
          max-w-[80%] p-3
          ${message.type === "user" 
            ? "bg-blue-500 text-white" 
            : "bg-card border border-border"}
        `}
      >
        {message.type === "user" ? (
          <p>{message.text}</p>
        ) : (
          <CollapsibleMessage text={message.text} />
        )}
        <div 
          className={`
            flex items-center justify-between text-xs mt-1 
            ${message.type === "user" ? "text-blue-100" : "text-muted-foreground"}
          `}
        >
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span title={formattedTime.exact}>{formattedTime.relative}</span>
          </div>
          
          {message.type === "user" && message.isRead !== undefined && (
            <div className="flex items-center" title={message.isRead ? "Read" : "Delivered"}>
              <CheckCheck className={`h-3 w-3 ${message.isRead ? "opacity-100" : "opacity-50"}`} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
