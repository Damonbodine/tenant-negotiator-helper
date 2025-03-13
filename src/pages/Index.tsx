
import { useState } from "react";
import { Header } from "@/components/Header";
import { AgentChat } from "@/components/AgentChat";
import { MarketData } from "@/components/MarketData";
import { NegotiationTips } from "@/components/NegotiationTips";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { KnowledgeManagement } from "@/components/KnowledgeManagement";

const Index = () => {
  const [activeTab, setActiveTab] = useState("knowledge");
  
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
          <div className="h-[calc(100vh-9rem)] grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KnowledgeBase />
            <KnowledgeManagement />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
