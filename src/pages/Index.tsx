
import { useState } from "react";
import { Header } from "@/components/Header";
import { AgentChat } from "@/components/AgentChat";
import { MarketData } from "@/components/MarketData";
import { NegotiationTips } from "@/components/NegotiationTips";
import { KnowledgeBase } from "@/components/KnowledgeBase";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 container py-6">
        {activeTab === "chat" && (
          <div className="h-[calc(100vh-9rem)]">
            <AgentChat />
          </div>
        )}
        
        {activeTab === "market" && <MarketData />}
        
        {activeTab === "tips" && <NegotiationTips />}
        
        {activeTab === "knowledge" && (
          <div className="h-[calc(100vh-9rem)]">
            <KnowledgeBase />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
