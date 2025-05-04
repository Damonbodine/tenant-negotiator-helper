
import { Card } from "@/shared/ui/card";
import { ChatMessage as ChatMessageType } from "@/shared/types";
import { CollapsibleMessage } from "@/components/chat/CollapsibleMessage";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
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
            text-xs mt-1 
            ${message.type === "user" ? "text-blue-100" : "text-muted-foreground"}
          `}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </Card>
    </div>
  );
}
