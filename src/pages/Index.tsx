
import { useState } from "react";
import { Header } from "@/components/Header";
import { AgentChat } from "@/components/AgentChat";
import { MarketData } from "@/components/MarketData";
import { NegotiationTips } from "@/components/NegotiationTips";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { KnowledgeManagement } from "@/components/KnowledgeManagement";
import { Button } from "@/components/ui/button";
import { Headphones } from "lucide-react";
import { Link } from "react-router-dom";

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
        
        {activeTab === "tips" && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold gradient-heading">Negotiation Strategies</h2>
                <p className="text-muted-foreground mt-1">
                  Expert tips to help you secure a better rental deal
                </p>
              </div>
              <Link to="/practice">
                <Button className="gap-2">
                  <Headphones className="h-4 w-4" />
                  Practice Negotiation
                </Button>
              </Link>
            </div>
            <NegotiationTips />
          </div>
        )}
        
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
