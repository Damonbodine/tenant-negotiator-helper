
import { useState } from "react";
import { Header } from "@/components/Header";
import { AgentChat } from "@/components/AgentChat";
import { MarketData } from "@/components/MarketData";
import { NegotiationTips } from "@/components/NegotiationTips";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { KnowledgeManagement } from "@/components/KnowledgeManagement";
import { Button } from "@/components/ui/button";
import { Headphones, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [activeTab, setActiveTab] = useState("knowledge");
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
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
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">Negotiation Strategies</h2>
                <p className="text-muted-foreground mt-1">
                  Expert tips to help you secure a better rental deal
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <a href="https://ditchmyrent.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Visit DitchMyRent
                  </Button>
                </a>
                <Link to="/practice">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Headphones className="h-4 w-4" />
                    Practice Negotiation
                  </Button>
                </Link>
              </div>
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
