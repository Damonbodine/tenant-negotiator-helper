
import { Card } from "@/shared/ui/card";
import { ChatMessage as ChatMessageType } from "@/shared/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  return (
    <div 
      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
      aria-live={message.type === "agent" ? "polite" : "off"}
    >
      <Card 
        className={`
          max-w-[80%] p-3
          ${message.type === "user" 
            ? "bg-blue-500 text-white" 
            : "bg-card border border-border"}
        `}
      >
        <p>{message.text}</p>
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
