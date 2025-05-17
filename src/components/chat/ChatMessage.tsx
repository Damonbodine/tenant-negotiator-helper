
import { Card } from "@/components/ui/card";
import { CollapsibleMessage } from "./CollapsibleMessage";

interface Message {
  id: string;
  type: "user" | "agent";
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
      <Card 
        className={`
          max-w-[80%] p-3
          ${message.type === "user" 
            ? "bg-blue-500 text-white" 
            : "bg-card border border-border text-white"}
        `}
      >
        {message.type === "user" ? (
          <p className="break-words text-white">{message.text}</p>
        ) : (
          <CollapsibleMessage text={message.text} />
        )}
        <div 
          className={`
            text-xs mt-1 
            ${message.type === "user" ? "text-blue-100" : "text-white/80"}
          `}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </Card>
    </div>
  );
}
